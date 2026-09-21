'use server'

import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { db } from '@/db/client'
import { metas } from '@/db/schema'
import { erroInesperado } from '@/modulos/comum/erros-de-acao'
import { errosPorCampo, type EstadoFormulario } from '@/modulos/comum/formulario'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { esquemaMeta, lerFormularioDeMeta, xpDaMetaValidada } from './validacao'

/**
 * Escrita de metas.
 *
 * O dono sai sempre de `exigirUsuario()`. Nenhuma ação aceita `usuarioId`
 * do formulário, e todo UPDATE e DELETE carrega o dono no WHERE — assim um
 * id de outra pessoa não encontra linha em vez de alterar a errada.
 *
 * As funções `tentar*` nunca redirecionam. O `redirect()` fica fora do try,
 * porque ele funciona lançando exceção e dentro de um catch viraria "erro
 * inesperado".
 */

type Resultado = EstadoFormulario | { destino: string }

async function tentarSalvar(formulario: FormData, metaId?: string): Promise<Resultado> {
  const usuario = await exigirUsuario()
  const entrada = esquemaMeta.safeParse(lerFormularioDeMeta(formulario))
  if (!entrada.success) return { erros: errosPorCampo(entrada.error) }

  const dados = entrada.data
  const valores = {
    titulo: dados.titulo,
    descricao: dados.descricao,
    categoria: dados.categoria,
    prioridade: dados.prioridade,
    dificuldade: dados.dificuldade,
    dataInicio: dados.dataInicio,
    prazo: dados.prazo,
    visibilidade: dados.visibilidade,
    valorAlvo: dados.valorAlvo,
    valorAtual: dados.valorAtual,
    // Calculado, nunca digitado: XP no formulário seria XP à vontade.
    xpRecompensa: xpDaMetaValidada(dados),
  }

  if (metaId) {
    const alteradas = await db
      .update(metas)
      .set(valores)
      .where(and(eq(metas.id, metaId), eq(metas.usuarioId, usuario.id)))
      .returning({ id: metas.id })

    if (alteradas.length === 0) {
      return { erros: { formulario: 'Meta não encontrada.' } }
    }
    return { destino: `/metas/${metaId}` }
  }

  const criadas = await db
    .insert(metas)
    .values({ ...valores, usuarioId: usuario.id })
    .returning({ id: metas.id })

  return { destino: `/metas/${criadas[0].id}` }
}

function concluir(resultado: Resultado): EstadoFormulario {
  if ('destino' in resultado) {
    revalidatePath('/metas')
    revalidatePath('/hoje')
    redirect(resultado.destino)
  }
  return resultado
}

export async function criarMeta(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  let resultado: Resultado
  try {
    resultado = await tentarSalvar(formulario)
  } catch (erro) {
    return erroInesperado(erro, 'criarMeta')
  }
  return concluir(resultado)
}

export async function atualizarMeta(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const metaId = String(formulario.get('metaId') ?? '')
  if (!metaId) return { erros: { formulario: 'Meta não informada.' } }

  let resultado: Resultado
  try {
    resultado = await tentarSalvar(formulario, metaId)
  } catch (erro) {
    return erroInesperado(erro, 'atualizarMeta')
  }
  return concluir(resultado)
}

const STATUS_VALIDOS = new Set(['ativa', 'concluida', 'arquivada'])

/** Concluir, arquivar ou reabrir. É o caminho preferido em vez de excluir. */
export async function mudarStatusDaMeta(formulario: FormData): Promise<void> {
  const metaId = String(formulario.get('metaId') ?? '')
  const status = String(formulario.get('status') ?? '')
  if (!metaId || !STATUS_VALIDOS.has(status)) return

  const usuario = await exigirUsuario()
  await db
    .update(metas)
    .set({ status: status as 'ativa' | 'concluida' | 'arquivada' })
    .where(and(eq(metas.id, metaId), eq(metas.usuarioId, usuario.id)))

  revalidatePath('/metas')
  revalidatePath(`/metas/${metaId}`)
  revalidatePath('/hoje')
  redirect(`/metas/${metaId}`)
}

/**
 * Apagar de vez. Leva junto as tarefas e o histórico de conclusões, pelo
 * ON DELETE CASCADE — por isso a tela pede confirmação antes de chamar, e
 * por isso arquivar existe.
 */
export async function excluirMeta(formulario: FormData): Promise<void> {
  const metaId = String(formulario.get('metaId') ?? '')
  if (!metaId) return

  const usuario = await exigirUsuario()
  await db.delete(metas).where(and(eq(metas.id, metaId), eq(metas.usuarioId, usuario.id)))

  revalidatePath('/metas')
  revalidatePath('/hoje')
  redirect('/metas')
}
