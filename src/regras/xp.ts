/**
 * Quanto vale cada coisa.
 *
 * Todo número de balanceamento do Zelvo está neste arquivo. Mudar o quanto
 * uma meta difícil recompensa é mudar uma constante aqui, e nada mais.
 */

export type Dificuldade = 'facil' | 'media' | 'dificil'
export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica'

export const XP_BASE_DIFICULDADE: Record<Dificuldade, number> = {
  facil: 100,
  media: 250,
  dificil: 500,
}

export const MULT_PRIORIDADE: Record<Prioridade, number> = {
  baixa: 1,
  media: 1.1,
  alta: 1.25,
  critica: 1.5,
}

export const XP_TAREFA_POR_PRIORIDADE: Record<Prioridade, number> = {
  baixa: 5,
  media: 10,
  alta: 20,
  critica: 35,
}

/** A cada 7 dias seguidos de sequência, um bônus. */
export const BONUS_A_CADA_DIAS = 7
export const BONUS_DE_STREAK = 50

/** Recompensa de concluir a meta inteira. Arredonda para a dezena. */
export function xpDaMeta(dificuldade: Dificuldade, prioridade: Prioridade): number {
  const bruto = XP_BASE_DIFICULDADE[dificuldade] * MULT_PRIORIDADE[prioridade]
  return Math.round(bruto / 10) * 10
}

/**
 * Recompensa de concluir uma tarefa. O usuário pode definir na mão;
 * sem isso, vem da prioridade.
 */
export function xpDaTarefa(prioridade: Prioridade, xpManual?: number | null): number {
  if (typeof xpManual === 'number' && Number.isFinite(xpManual) && xpManual >= 0) {
    return Math.round(xpManual)
  }
  return XP_TAREFA_POR_PRIORIDADE[prioridade]
}

/**
 * Bônus pago quando a sequência cruza um múltiplo de BONUS_A_CADA_DIAS.
 * Recebe a sequência DEPOIS da conclusão do dia.
 */
export function bonusDeStreak(streakAposHoje: number): number {
  if (streakAposHoje <= 0) return 0
  return streakAposHoje % BONUS_A_CADA_DIAS === 0 ? BONUS_DE_STREAK : 0
}
