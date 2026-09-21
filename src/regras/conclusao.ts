/**
 * Quanto vale concluir uma tarefa hoje.
 *
 * Separado da ação de banco porque é a conta que paga XP, e conta que paga
 * precisa ser testável sem banco nenhum. Recebe o histórico de dias com
 * conclusão e devolve o que gravar.
 */
import type { DataISO } from './datas'
import { calcularStreak } from './streak'
import { bonusDeStreak } from './xp'

export type ValorDaConclusao = {
  /** O que vai em `xp_ganho`: a tarefa mais o bônus, quando houve. */
  xpGanho: number
  bonus: number
  /** A sequência depois de contar hoje. */
  streak: number
}

export function valorDaConclusao(
  xpDaTarefa: number,
  diasComConclusao: DataISO[],
  hoje: DataISO,
): ValorDaConclusao {
  const jaFezAlgoHoje = diasComConclusao.includes(hoje)
  const sequencia = calcularStreak(
    jaFezAlgoHoje ? diasComConclusao : [...diasComConclusao, hoje],
    hoje,
  )

  // O bônus é do DIA, não da tarefa: só a primeira conclusão do dia pode
  // pagá-lo, senão dez tarefas num dia sete pagariam dez bônus.
  const bonus = jaFezAlgoHoje ? 0 : bonusDeStreak(sequencia.atual)

  return { xpGanho: xpDaTarefa + bonus, bonus, streak: sequencia.atual }
}
