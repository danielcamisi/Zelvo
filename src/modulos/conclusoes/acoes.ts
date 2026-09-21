'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db/client'
import { conclusoesTarefa, progressoUsuario, tarefas } from '@/db/schema'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { erroInesperado } from '@/modulos/comum/erros-de-acao'
import { type DataISO, dataNoFuso } from '@/regras/datas'
import { nivelPorXp } from '@/regras/nivel'
import { ocorreEm } from '@/regras/recorrencia'
import { calcularStreak } from '@/regras/streak'
import { valorDaConclusao } from '@/regras/conclusao'
import { diasComConclusao, xpAcumulado } from './consultas'

/**
 * Concluir e desfazer.
 *
 * Duas decisões sustentam este arquivo:
 *
 * 1. O dia é calculado no servidor, no fuso do usuário. Nunca vem do cliente
 *    — aceitar a data do navegador seria aceitar XP de qualquer dia.
 *
 * 2. O XP total e a sequência são RECALCULADOS do histórico a cada escrita,
 *    em vez de somados a um contador. É mais trabalho por clique e vale a
 *    pena: desfazer uma conclusão volta a ser só apagar uma linha, sem
 *    precisar lembrar quanto foi pago e quando. O bônus de sequência entra
 *    dentro do `xp_ganho` da conclusão que o mereceu, pelo mesmo motivo.
 */

export type ResultadoConclusao =
  | {
      ok: true
      /** Já inclui o bônus de sequência, quando houve. */
      xpGanho: number
      bonus: number
      xpTotal: number
      nivelAntes: number
      nivelDepois: number
      rank: string
      streak: number
    }
  | { ok: false; motivo: string }

/** Recalcula XP, nível, rank e sequência a partir do histórico inteiro. */
async function recalcularProgresso(usuarioId: string, hoje: DataISO) {
  const [xpTotal, dias] = await Promise.all([
    xpAcumulado(usuarioId),
    diasComConclusao(usuarioId),
  ])

  const streak = calcularStreak(dias, hoje)
  const { nivel, rank } = nivelPorXp(xpTotal)

  await db
    .update(progressoUsuario)
    .set({
      xpTotal,
      nivel,
      rank,
      streakAtual: streak.atual,
      melhorStreak: streak.melhor,
      ultimoDiaAtivo: dias.length > 0 ? dias[dias.length - 1] : null,
    })
    .where(eq(progressoUsuario.usuarioId, usuarioId))

  return { xpTotal, nivel, rank, streak }
}

function atualizarTelas() {
  revalidatePath('/hoje')
  revalidatePath('/tarefas')
  revalidatePath('/perfil')
  revalidatePath('/metas')
}

export async function concluirTarefa(tarefaId: string): Promise<ResultadoConclusao> {
  try {
    const usuario = await exigirUsuario()
    const hoje = dataNoFuso(new Date(), usuario.timezone)

    const linhas = await db
      .select()
      .from(tarefas)
      .where(and(eq(tarefas.id, tarefaId), eq(tarefas.usuarioId, usuario.id)))
      .limit(1)

    const tarefa = linhas[0]
    if (!tarefa) return { ok: false, motivo: 'Tarefa não encontrada.' }
    if (!tarefa.ativa) return { ok: false, motivo: 'Esta tarefa está pausada.' }
    if (!ocorreEm(tarefa, hoje)) {
      return { ok: false, motivo: 'Esta tarefa não está marcada para hoje.' }
    }

    const dias = await diasComConclusao(usuario.id)
    const { xpGanho, bonus } = valorDaConclusao(tarefa.xp, dias, hoje)

    const gravadas = await db
      .insert(conclusoesTarefa)
      .values({
        tarefaId: tarefa.id,
        usuarioId: usuario.id,
        dataReferencia: hoje,
        xpGanho,
      })
      // A UNIQUE (tarefa, dia) é o que impede dois toques rápidos virarem
      // XP em dobro; aqui isso vira "nada a fazer" em vez de erro.
      .onConflictDoNothing()
      .returning({ id: conclusoesTarefa.id })

    if (gravadas.length === 0) {
      return { ok: false, motivo: 'Esta tarefa já foi concluída hoje.' }
    }

    const nivelAntes = nivelPorXp(usuario.xpTotal).nivel
    const depois = await recalcularProgresso(usuario.id, hoje)
    atualizarTelas()

    return {
      ok: true,
      xpGanho,
      bonus,
      xpTotal: depois.xpTotal,
      nivelAntes,
      nivelDepois: depois.nivel,
      rank: depois.rank,
      streak: depois.streak.atual,
    }
  } catch (erro) {
    const { erros } = erroInesperado(erro, 'concluirTarefa')
    return { ok: false, motivo: erros?.formulario ?? 'Não foi possível concluir agora.' }
  }
}

/** Desfaz a conclusão de hoje. Um toque errado no celular não pode ser definitivo. */
export async function desfazerConclusao(tarefaId: string): Promise<ResultadoConclusao> {
  try {
    const usuario = await exigirUsuario()
    const hoje = dataNoFuso(new Date(), usuario.timezone)

    const apagadas = await db
      .delete(conclusoesTarefa)
      .where(
        and(
          eq(conclusoesTarefa.tarefaId, tarefaId),
          eq(conclusoesTarefa.usuarioId, usuario.id),
          eq(conclusoesTarefa.dataReferencia, hoje),
        ),
      )
      .returning({ xpGanho: conclusoesTarefa.xpGanho })

    if (apagadas.length === 0) {
      return { ok: false, motivo: 'Esta tarefa não está concluída hoje.' }
    }

    const nivelAntes = nivelPorXp(usuario.xpTotal).nivel
    const depois = await recalcularProgresso(usuario.id, hoje)
    atualizarTelas()

    return {
      ok: true,
      // Negativo de propósito: é a variação de XP, e desfazer tira o que pagou.
      xpGanho: -apagadas[0].xpGanho,
      bonus: 0,
      xpTotal: depois.xpTotal,
      nivelAntes,
      nivelDepois: depois.nivel,
      rank: depois.rank,
      streak: depois.streak.atual,
    }
  } catch (erro) {
    const { erros } = erroInesperado(erro, 'desfazerConclusao')
    return { ok: false, motivo: erros?.formulario ?? 'Não foi possível desfazer agora.' }
  }
}
