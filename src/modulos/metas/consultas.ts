import 'server-only'

import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { metas, tarefas } from '@/db/schema'

/**
 * Leitura de metas.
 *
 * Toda consulta daqui recebe `usuarioId` e o usa no WHERE. É a primeira
 * camada de isolamento entre usuários; a RLS no banco é a segunda. Nenhuma
 * das duas é suficiente sozinha, e nenhuma função aqui aceita ser chamada
 * sem dono.
 */

export type MetaDaLista = typeof metas.$inferSelect & { totalTarefas: number }

export async function listarMetas(
  usuarioId: string,
  status: 'ativa' | 'concluida' | 'arquivada' | 'todas' = 'ativa',
): Promise<MetaDaLista[]> {
  const filtro =
    status === 'todas'
      ? eq(metas.usuarioId, usuarioId)
      : and(eq(metas.usuarioId, usuarioId), eq(metas.status, status))

  const linhas = await db
    .select()
    .from(metas)
    .where(filtro)
    // Prazo primeiro, e meta sem prazo por último: o que tem data marcada é
    // o que o usuário precisa ver antes.
    .orderBy(sql`${metas.prazo} asc nulls last`, desc(metas.criadaEm))

  if (linhas.length === 0) return []

  const contagens = await db
    .select({ metaId: tarefas.metaId, total: sql<number>`count(*)::int` })
    .from(tarefas)
    .where(
      and(
        eq(tarefas.usuarioId, usuarioId),
        eq(tarefas.ativa, true),
        inArray(
          tarefas.metaId,
          linhas.map((meta) => meta.id),
        ),
      ),
    )
    .groupBy(tarefas.metaId)

  const porMeta = new Map(contagens.map((linha) => [linha.metaId, Number(linha.total)]))
  return linhas.map((meta) => ({ ...meta, totalTarefas: porMeta.get(meta.id) ?? 0 }))
}

export async function buscarMeta(usuarioId: string, metaId: string) {
  const linhas = await db
    .select()
    .from(metas)
    .where(and(eq(metas.id, metaId), eq(metas.usuarioId, usuarioId)))
    .limit(1)

  return linhas[0] ?? null
}

export async function tarefasDaMeta(usuarioId: string, metaId: string) {
  return db
    .select()
    .from(tarefas)
    .where(and(eq(tarefas.metaId, metaId), eq(tarefas.usuarioId, usuarioId)))
    .orderBy(desc(tarefas.ativa), asc(tarefas.horario), asc(tarefas.criadaEm))
}

/** Quantas metas há em cada status, para os filtros da lista. */
export async function contarMetasPorStatus(usuarioId: string) {
  const linhas = await db
    .select({ status: metas.status, total: sql<number>`count(*)::int` })
    .from(metas)
    .where(eq(metas.usuarioId, usuarioId))
    .groupBy(metas.status)

  const contagem = { ativa: 0, concluida: 0, arquivada: 0 }
  for (const linha of linhas) contagem[linha.status] = Number(linha.total)
  return contagem
}

/**
 * As metas que podem ser escolhidas no formulário de tarefa.
 *
 * São as ativas, mais a meta que a tarefa já usa — sem isso, editar uma
 * tarefa de meta arquivada faria o seletor abrir sem a opção atual e, ao
 * salvar, a tarefa perderia a meta em silêncio.
 */
export async function metasParaEscolha(
  usuarioId: string,
  incluirId?: string | null,
): Promise<{ id: string; titulo: string }[]> {
  const ativas = await db
    .select({ id: metas.id, titulo: metas.titulo })
    .from(metas)
    .where(and(eq(metas.usuarioId, usuarioId), eq(metas.status, 'ativa')))
    .orderBy(asc(metas.titulo))

  if (!incluirId || ativas.some((meta) => meta.id === incluirId)) return ativas

  const extra = await buscarMeta(usuarioId, incluirId)
  return extra ? [{ id: extra.id, titulo: extra.titulo }, ...ativas] : ativas
}
