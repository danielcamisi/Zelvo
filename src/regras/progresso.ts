/**
 * Quanto de uma meta já foi feito.
 *
 * Dois tipos de meta, duas contas:
 *  - meta financeira (tem valor alvo): o progresso é o dinheiro guardado;
 *  - meta de hábito: conclusões realizadas ÷ ocorrências previstas até hoje.
 *
 * O "até hoje" importa: uma meta anual não fica em 3% no segundo dia só
 * porque o ano é longo. Ela compara o que você fez com o que já era devido.
 */
import type { DataISO } from './datas'
import { ocorrenciasPrevistas, type TarefaRecorrente } from './recorrencia'

export type MetaParaProgresso = {
  dataInicio: DataISO
  prazo?: DataISO | null
  valorAlvo?: string | number | null
  valorAtual?: string | number | null
}

export type TarefaComConclusoes = TarefaRecorrente & {
  id: string
}

export type Conclusao = {
  tarefaId: string
  dataReferencia: DataISO
}

function comoNumero(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? n : null
}

function limitar(valor: number): number {
  return Math.max(0, Math.min(100, Math.round(valor)))
}

export function progressoDaMeta(
  meta: MetaParaProgresso,
  tarefas: TarefaComConclusoes[],
  conclusoes: Conclusao[],
  hoje: DataISO,
): number {
  const alvo = comoNumero(meta.valorAlvo)

  // Meta financeira.
  if (alvo !== null && alvo > 0) {
    const atual = comoNumero(meta.valorAtual) ?? 0
    return limitar((atual / alvo) * 100)
  }

  if (tarefas.length === 0) return 0

  // O período já devido: do início até hoje, sem passar do prazo.
  const fim = meta.prazo && meta.prazo < hoje ? meta.prazo : hoje
  if (fim < meta.dataInicio) return 0

  let previstas = 0
  for (const tarefa of tarefas) {
    const de = tarefa.inicioEm > meta.dataInicio ? tarefa.inicioEm : meta.dataInicio
    previstas += ocorrenciasPrevistas(tarefa, de, fim)
  }
  if (previstas === 0) return 0

  const idsDaMeta = new Set(tarefas.map((t) => t.id))
  const realizadas = conclusoes.filter(
    (c) => idsDaMeta.has(c.tarefaId) && c.dataReferencia >= meta.dataInicio && c.dataReferencia <= fim,
  ).length

  return limitar((realizadas / previstas) * 100)
}
