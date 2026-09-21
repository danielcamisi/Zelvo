/**
 * Sequência de dias.
 *
 * Regra: um dia conta se teve ao menos uma conclusão. É menos punitivo do que
 * exigir o dia inteiro e sustenta melhor o uso diário — que é o ponto do app.
 * Para endurecer, mude `diaConta` e nada mais.
 *
 * O dia de hoje tem carência: se você ainda não concluiu nada hoje mas concluiu
 * ontem, a sequência continua viva. Ela só quebra quando o dia passa em branco.
 */
import { type DataISO, diferencaEmDias } from './datas'

export type ResultadoStreak = {
  atual: number
  melhor: number
}

export function calcularStreak(datasConcluidas: DataISO[], hoje: DataISO): ResultadoStreak {
  const dias = [...new Set(datasConcluidas)].sort()
  if (dias.length === 0) return { atual: 0, melhor: 0 }

  // Maior sequência de dias consecutivos em toda a história.
  let melhor = 1
  let corrida = 1
  for (let i = 1; i < dias.length; i += 1) {
    if (diferencaEmDias(dias[i], dias[i - 1]) === 1) {
      corrida += 1
      melhor = Math.max(melhor, corrida)
    } else {
      corrida = 1
    }
  }

  // Sequência atual: conta para trás a partir do último dia com conclusão,
  // desde que esse dia seja hoje ou ontem.
  const ultimo = dias[dias.length - 1]
  const distancia = diferencaEmDias(hoje, ultimo)
  if (distancia > 1 || distancia < 0) return { atual: 0, melhor }

  let atual = 1
  for (let i = dias.length - 1; i > 0; i -= 1) {
    if (diferencaEmDias(dias[i], dias[i - 1]) === 1) atual += 1
    else break
  }

  return { atual, melhor: Math.max(melhor, atual) }
}

/** O dia contou? Hoje é uma conclusão só. Mude aqui para endurecer a regra. */
export function diaConta(conclusoesNoDia: number): boolean {
  return conclusoesNoDia >= 1
}
