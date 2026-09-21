import 'server-only'

import { and, asc, desc, eq, isNull, or } from 'drizzle-orm'

import { db } from '@/db/client'
import { metas, tarefas } from '@/db/schema'
import { dataNoFuso, type DataISO } from '@/regras/datas'
import { tarefasDoDia } from '@/regras/recorrencia'

/**
 * Leitura de tarefas.
 *
 * Qual tarefa cai em qual dia é decidido em `regras/recorrencia`, não em
 * SQL. O banco devolve as tarefas ativas do usuário e a regra — que é pura e
 * testada — filtra o dia. Escrever essa lógica em SQL significaria manter
 * duas versões dela e descobrir a divergência tarde.
 */

export type TarefaComMeta = typeof tarefas.$inferSelect & {
  metaTitulo: string | null
  metaCategoria: string | null
}

export async function buscarTarefa(usuarioId: string, tarefaId: string) {
  const linhas = await db
    .select()
    .from(tarefas)
    .where(and(eq(tarefas.id, tarefaId), eq(tarefas.usuarioId, usuarioId)))
    .limit(1)

  return linhas[0] ?? null
}

/** Tarefas ativas do usuário, com o título da meta quando existe. */
export async function tarefasAtivas(usuarioId: string): Promise<TarefaComMeta[]> {
  const linhas = await db
    .select({
      tarefa: tarefas,
      metaTitulo: metas.titulo,
      metaCategoria: metas.categoria,
    })
    .from(tarefas)
    .leftJoin(metas, eq(metas.id, tarefas.metaId))
    .where(
      and(
        eq(tarefas.usuarioId, usuarioId),
        eq(tarefas.ativa, true),
        // Tarefa de meta arquivada não deve mais aparecer no dia; tarefa
        // solta (sem meta) continua valendo.
        or(isNull(tarefas.metaId), eq(metas.status, 'ativa')),
      ),
    )
    .orderBy(asc(tarefas.horario), asc(tarefas.criadaEm))

  return linhas.map(({ tarefa, metaTitulo, metaCategoria }) => ({
    ...tarefa,
    metaTitulo,
    metaCategoria,
  }))
}

/** As tarefas que caem num dia, no fuso do usuário. */
export async function tarefasDeHoje(usuarioId: string, timezone: string) {
  const hoje = dataNoFuso(new Date(), timezone) as DataISO
  const ativas = await tarefasAtivas(usuarioId)
  return { hoje, tarefas: tarefasDoDia(ativas, hoje) }
}

/**
 * Todas as tarefas do usuário, ativas e pausadas.
 *
 * É a lista de gerenciamento — diferente de `tarefasAtivas`, que alimenta o
 * dia. Aqui a tarefa pausada precisa aparecer, senão não há como retomá-la.
 */
export async function todasAsTarefas(usuarioId: string): Promise<TarefaComMeta[]> {
  const linhas = await db
    .select({ tarefa: tarefas, metaTitulo: metas.titulo, metaCategoria: metas.categoria })
    .from(tarefas)
    .leftJoin(metas, eq(metas.id, tarefas.metaId))
    .where(eq(tarefas.usuarioId, usuarioId))
    // Ativas primeiro; dentro delas, por horário. As pausadas ficam no fim,
    // visíveis para poder retomar, longe o bastante para não atrapalhar.
    .orderBy(desc(tarefas.ativa), asc(tarefas.horario), asc(tarefas.criadaEm))

  return linhas.map(({ tarefa, metaTitulo, metaCategoria }) => ({
    ...tarefa,
    metaTitulo,
    metaCategoria,
  }))
}
