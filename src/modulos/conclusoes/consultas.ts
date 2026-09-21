import 'server-only'

import { and, asc, eq, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { conclusoesTarefa } from '@/db/schema'
import type { DataISO } from '@/regras/datas'

/**
 * Leitura do histórico de conclusões.
 *
 * Lembrando o desenho do schema: tarefa recorrente não tem status. "Concluída"
 * é sempre "concluída em tal dia", e é isso que estas consultas respondem.
 */

/** Os ids das tarefas já concluídas num dia. */
export async function conclusoesDoDia(usuarioId: string, data: DataISO): Promise<Set<string>> {
  const linhas = await db
    .select({ tarefaId: conclusoesTarefa.tarefaId })
    .from(conclusoesTarefa)
    .where(
      and(eq(conclusoesTarefa.usuarioId, usuarioId), eq(conclusoesTarefa.dataReferencia, data)),
    )

  return new Set(linhas.map((linha) => linha.tarefaId))
}

/**
 * Os dias em que houve ao menos uma conclusão, em ordem.
 *
 * É a entrada de `calcularStreak`. Vem do histórico inteiro de propósito: a
 * sequência é recalculada a cada conclusão, em vez de mantida incrementalmente,
 * porque um contador guardado erra em silêncio quando algo é desfeito.
 */
export async function diasComConclusao(usuarioId: string): Promise<DataISO[]> {
  const linhas = await db
    .selectDistinct({ dia: conclusoesTarefa.dataReferencia })
    .from(conclusoesTarefa)
    .where(eq(conclusoesTarefa.usuarioId, usuarioId))
    .orderBy(asc(conclusoesTarefa.dataReferencia))

  return linhas.map((linha) => linha.dia)
}

/** XP somado de todas as conclusões. A fonte da verdade do XP total. */
export async function xpAcumulado(usuarioId: string): Promise<number> {
  const linhas = await db
    .select({ total: sql<number>`coalesce(sum(${conclusoesTarefa.xpGanho}), 0)::int` })
    .from(conclusoesTarefa)
    .where(eq(conclusoesTarefa.usuarioId, usuarioId))

  return Number(linhas[0]?.total ?? 0)
}
