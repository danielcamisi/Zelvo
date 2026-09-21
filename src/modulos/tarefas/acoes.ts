'use server'

import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { db } from '@/db/client'
import { metas, tarefas } from '@/db/schema'
import { erroInesperado } from '@/modulos/comum/erros-de-acao'
import { errosPorCampo, type EstadoFormulario } from '@/modulos/comum/formulario'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { esquemaTarefa, lerFormularioDeTarefa } from './validacao'

/**
 * Escrita de tarefas. Mesmas garantias das metas: dono vindo da sessão, e
 * dono no WHERE de todo UPDATE e DELETE.
 */

type Resultado = EstadoFormulario | { destino: string }

/** Meta informada tem de ser do próprio usuário; tarefa sem meta é válida. */
async function metaPermitida(usuarioId: string, metaId: string | null): Promise<boolean> {
  if (!metaId) return true
  const linhas = await db
    .select({ id: metas.id })
    .from(metas)
    .where(and(eq(metas.id, metaId), eq(metas.usuarioId, usuarioId)))
    .limit(1)
  return linhas.length > 0
}

async function tentarSalvar(formulario: FormData, tarefaId?: string): Promise<Resultado> {
  const usuario = await exigirUsuario()
  const entrada = esquemaTarefa.safeParse(lerFormularioDeTarefa(formulario))
  if (!entrada.success) return { erros: errosPorCampo(entrada.error) }

  const metaIdBruto = String(formulario.get('metaId') ?? '').trim()
  const metaId = metaIdBruto === '' ? null : metaIdBruto

  if (!(await metaPermitida(usuario.id, metaId))) {
    return { erros: { metaId: 'Meta não encontrada.' } }
  }

  const dados = entrada.data
  const valores = {
    metaId,
    titulo: dados.titulo,
    descricao: dados.descricao,
    horario: dados.horario,
    recorrencia: dados.recorrencia,
    recorrenciaDias: dados.recorrenciaDias,
    dataUnica: dados.dataUnica,
    inicioEm: dados.inicioEm,
    fimEm: dados.fimEm,
    prioridade: dados.prioridade,
    xp: dados.xpFinal,
  }

  if (tarefaId) {
    const alteradas = await db
      .update(tarefas)
      .set(valores)
      .where(and(eq(tarefas.id, tarefaId), eq(tarefas.usuarioId, usuario.id)))
      .returning({ id: tarefas.id })

    if (alteradas.length === 0) return { erros: { formulario: 'Tarefa não encontrada.' } }
  } else {
    await db.insert(tarefas).values({ ...valores, usuarioId: usuario.id })
  }

  return { destino: metaId ? `/metas/${metaId}` : '/tarefas' }
}

function concluir(resultado: Resultado): EstadoFormulario {
  if ('destino' in resultado) {
    revalidatePath('/hoje')
    revalidatePath('/tarefas')
    revalidatePath('/metas')
    redirect(resultado.destino)
  }
  return resultado
}

export async function criarTarefa(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  let resultado: Resultado
  try {
    resultado = await tentarSalvar(formulario)
  } catch (erro) {
    return erroInesperado(erro, 'criarTarefa')
  }
  return concluir(resultado)
}

export async function atualizarTarefa(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const tarefaId = String(formulario.get('tarefaId') ?? '')
  if (!tarefaId) return { erros: { formulario: 'Tarefa não informada.' } }

  let resultado: Resultado
  try {
    resultado = await tentarSalvar(formulario, tarefaId)
  } catch (erro) {
    return erroInesperado(erro, 'atualizarTarefa')
  }
  return concluir(resultado)
}

/**
 * Pausar é o oposto de excluir: a tarefa some do dia a dia mas o histórico
 * de conclusões continua de pé, e a sequência não é reescrita.
 */
export async function alternarTarefaAtiva(formulario: FormData): Promise<void> {
  const tarefaId = String(formulario.get('tarefaId') ?? '')
  const ativa = String(formulario.get('ativa') ?? '') === 'true'
  if (!tarefaId) return

  const usuario = await exigirUsuario()
  await db
    .update(tarefas)
    .set({ ativa })
    .where(and(eq(tarefas.id, tarefaId), eq(tarefas.usuarioId, usuario.id)))

  revalidatePath('/hoje')
  revalidatePath('/tarefas')
  revalidatePath('/metas')
}

/** Apaga a tarefa e, por cascata, as conclusões dela. Pede confirmação na tela. */
export async function excluirTarefa(formulario: FormData): Promise<void> {
  const tarefaId = String(formulario.get('tarefaId') ?? '')
  const voltarPara = String(formulario.get('voltarPara') ?? '/tarefas')
  if (!tarefaId) return

  const usuario = await exigirUsuario()
  await db.delete(tarefas).where(and(eq(tarefas.id, tarefaId), eq(tarefas.usuarioId, usuario.id)))

  revalidatePath('/hoje')
  revalidatePath('/tarefas')
  revalidatePath('/metas')
  redirect(voltarPara.startsWith('/') ? voltarPara : '/tarefas')
}
