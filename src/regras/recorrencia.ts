/**
 * Quando uma tarefa acontece.
 *
 * Tudo aqui opera em 'AAAA-MM-DD'. Nada de `new Date()` solto: quem decide
 * qual é o dia de hoje é `dataNoFuso`, em datas.ts.
 */
import { type DataISO, diaDaSemana, diaDoMes, diasNoMes, intervaloDeDias, mesDoAno } from './datas'

export type Recorrencia = 'unica' | 'diaria' | 'semanal' | 'mensal' | 'anual'

/** Só o que a regra precisa saber. Uma linha de `tarefas` satisfaz isto. */
export type TarefaRecorrente = {
  recorrencia: Recorrencia
  /** semanal: 1..7 (segunda..domingo). mensal: 1..31. */
  recorrenciaDias?: number[] | null
  /** Usado por 'unica'. */
  dataUnica?: DataISO | null
  inicioEm: DataISO
  fimEm?: DataISO | null
  ativa?: boolean
}

export function ocorreEm(tarefa: TarefaRecorrente, data: DataISO): boolean {
  if (tarefa.ativa === false) return false
  if (data < tarefa.inicioEm) return false
  if (tarefa.fimEm && data > tarefa.fimEm) return false

  switch (tarefa.recorrencia) {
    case 'unica':
      return tarefa.dataUnica === data

    case 'diaria':
      return true

    case 'semanal': {
      const dias = tarefa.recorrenciaDias
      // Sem dias escolhidos, repete no mesmo dia da semana em que começou.
      if (!dias || dias.length === 0) return diaDaSemana(data) === diaDaSemana(tarefa.inicioEm)
      return dias.includes(diaDaSemana(data))
    }

    case 'mensal': {
      const dias = tarefa.recorrenciaDias
      const alvos = dias && dias.length > 0 ? dias : [diaDoMes(tarefa.inicioEm)]
      const hoje = diaDoMes(data)
      const ultimoDoMes = diasNoMes(data)
      // Dia 31 em fevereiro não some: cai no último dia do mês.
      return alvos.some((alvo) => (alvo > ultimoDoMes ? hoje === ultimoDoMes : hoje === alvo))
    }

    case 'anual': {
      const base = tarefa.dataUnica ?? tarefa.inicioEm
      if (mesDoAno(data) !== mesDoAno(base)) return false
      const alvo = diaDoMes(base)
      const ultimoDoMes = diasNoMes(data)
      // 29 de fevereiro em ano comum cai no dia 28.
      return alvo > ultimoDoMes ? diaDoMes(data) === ultimoDoMes : diaDoMes(data) === alvo
    }

    default:
      return false
  }
}

/** Quantas vezes a tarefa deveria ter acontecido no intervalo, inclusive. */
export function ocorrenciasPrevistas(
  tarefa: TarefaRecorrente,
  de: DataISO,
  ate: DataISO,
): number {
  return intervaloDeDias(de, ate).reduce(
    (total, dia) => (ocorreEm(tarefa, dia) ? total + 1 : total),
    0,
  )
}

/** Próximo dia em que a tarefa acontece, a partir de `apartirDe` inclusive. */
export function proximaOcorrencia(
  tarefa: TarefaRecorrente,
  apartirDe: DataISO,
  limiteDeDias = 366,
): DataISO | null {
  const fim = tarefa.fimEm ?? null
  for (const dia of intervaloDeDias(apartirDe, somarDiasSeguro(apartirDe, limiteDeDias))) {
    if (fim && dia > fim) return null
    if (ocorreEm(tarefa, dia)) return dia
  }
  return null
}

function somarDiasSeguro(data: DataISO, dias: number): DataISO {
  const d = new Date(data + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** As tarefas que caem num dia. */
export function tarefasDoDia<T extends TarefaRecorrente>(tarefas: T[], data: DataISO): T[] {
  return tarefas.filter((tarefa) => ocorreEm(tarefa, data))
}
