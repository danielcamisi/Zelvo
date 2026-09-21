import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { valorDaConclusao } from '../conclusao'
import { BONUS_A_CADA_DIAS, BONUS_DE_STREAK } from '../xp'

/** Os N dias terminados em 21/09/2026, para montar sequências de propósito. */
function diasAte(quantidade: number): string[] {
  const dias: string[] = []
  for (let i = quantidade; i >= 1; i -= 1) {
    const data = new Date(Date.UTC(2026, 8, 21))
    data.setUTCDate(data.getUTCDate() - i)
    dias.push(data.toISOString().slice(0, 10))
  }
  return dias
}

describe('valor de uma conclusão', () => {
  const HOJE = '2026-09-21'

  it('paga só o XP da tarefa em dia comum', () => {
    const valor = valorDaConclusao(25, ['2026-09-20'], HOJE)
    assert.equal(valor.xpGanho, 25)
    assert.equal(valor.bonus, 0)
    assert.equal(valor.streak, 2)
  })

  it('paga o bônus quando a sequência fecha a semana', () => {
    // Seis dias antes de hoje: concluir hoje fecha sete.
    const valor = valorDaConclusao(25, diasAte(BONUS_A_CADA_DIAS - 1), HOJE)
    assert.equal(valor.streak, BONUS_A_CADA_DIAS)
    assert.equal(valor.bonus, BONUS_DE_STREAK)
    assert.equal(valor.xpGanho, 25 + BONUS_DE_STREAK)
  })

  it('não paga o bônus duas vezes no mesmo dia', () => {
    // O mesmo caso de cima, mas hoje já teve uma conclusão: a segunda tarefa
    // do dia leva só o próprio XP.
    const dias = [...diasAte(BONUS_A_CADA_DIAS - 1), HOJE]
    const valor = valorDaConclusao(25, dias, HOJE)
    assert.equal(valor.streak, BONUS_A_CADA_DIAS)
    assert.equal(valor.bonus, 0)
    assert.equal(valor.xpGanho, 25)
  })

  it('recomeça a sequência quando o dia anterior passou em branco', () => {
    const valor = valorDaConclusao(10, ['2026-09-10', '2026-09-11'], HOJE)
    assert.equal(valor.streak, 1)
    assert.equal(valor.bonus, 0)
  })

  it('conta a primeira conclusão da vida como sequência de um dia', () => {
    const valor = valorDaConclusao(10, [], HOJE)
    assert.equal(valor.streak, 1)
    assert.equal(valor.xpGanho, 10)
  })
})
