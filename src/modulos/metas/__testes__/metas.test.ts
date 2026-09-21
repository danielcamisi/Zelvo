import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { errosPorCampo } from '../../comum/formulario'
import { dinheiroParaCampo } from '../../comum/rotulos'
import { esquemaMeta, xpDaMetaValidada } from '../validacao'

const BASE = {
  titulo: 'Juntar reserva de emergência',
  descricao: '',
  categoria: 'financas',
  prioridade: 'alta',
  dificuldade: 'dificil',
  dataInicio: '2026-09-21',
  prazo: '',
  visibilidade: 'privada',
  valorAlvo: '',
  valorAtual: '',
}

function erros(entrada: Record<string, unknown>) {
  const saida = esquemaMeta.safeParse(entrada)
  return saida.success ? {} : errosPorCampo(saida.error)
}

describe('validação de meta', () => {
  it('aceita o caso simples e limpa campos vazios', () => {
    const saida = esquemaMeta.safeParse(BASE)
    assert.equal(saida.success, true)
    if (!saida.success) return

    assert.equal(saida.data.descricao, null)
    assert.equal(saida.data.prazo, null)
    assert.equal(saida.data.valorAlvo, null)
  })

  it('nasce privada quando o campo não vem', () => {
    // Meta financeira que vazasse por omissão seria o pior tipo de padrão.
    const { visibilidade: _ignorado, ...semVisibilidade } = BASE
    const saida = esquemaMeta.safeParse(semVisibilidade)
    assert.equal(saida.success, true)
    assert.equal(saida.success && saida.data.visibilidade, 'privada')
  })

  it('recusa prazo antes do início', () => {
    assert.match(
      erros({ ...BASE, prazo: '2026-09-20' }).prazo ?? '',
      /não pode ser antes do início/,
    )
  })

  it('aceita prazo igual ao início', () => {
    assert.equal(esquemaMeta.safeParse({ ...BASE, prazo: '2026-09-21' }).success, true)
  })

  it('lê dinheiro como se digita em português', () => {
    const saida = esquemaMeta.safeParse({ ...BASE, valorAlvo: '15.000,50', valorAtual: '1200' })
    assert.equal(saida.success, true)
    if (!saida.success) return
    // Texto, não número: `numeric` do Postgres não sofre com ponto flutuante.
    assert.equal(saida.data.valorAlvo, '15000.50')
    assert.equal(saida.data.valorAtual, '1200')
  })

  it('recusa valor em meta que não é de finanças', () => {
    assert.match(
      erros({ ...BASE, categoria: 'saude', valorAlvo: '500' }).valorAlvo ?? '',
      /só vale para metas de Finanças/,
    )
  })

  it('recusa valor atual sem valor alvo', () => {
    assert.match(erros({ ...BASE, valorAtual: '500' }).valorAlvo ?? '', /quer alcançar/)
  })

  it('recusa título curto, categoria inválida e data sem sentido', () => {
    const saida = erros({ ...BASE, titulo: 'a', categoria: 'inexistente', dataInicio: '21/09/2026' })
    assert.deepEqual(Object.keys(saida).sort(), ['categoria', 'dataInicio', 'titulo'])
  })

  it('calcula o XP da meta em vez de aceitar do formulário', () => {
    // 500 (difícil) x 1,25 (alta) = 625, arredondado para a dezena.
    assert.equal(xpDaMetaValidada({ dificuldade: 'dificil', prioridade: 'alta' }), 630)
    assert.equal(xpDaMetaValidada({ dificuldade: 'facil', prioridade: 'baixa' }), 100)
  })
})

describe('dinheiro entre o banco e o formulário', () => {
  it('reabre o valor salvo sem multiplicá-lo por cem', () => {
    // O `numeric` devolve '15000.00'. Jogar isso direto no campo faria a
    // validação ler o ponto como separador de milhar e salvar 1500000 —
    // o bug que `dinheiroParaCampo` existe para impedir.
    const doBanco = '15000.00'
    const saida = esquemaMeta.safeParse({
      ...BASE,
      valorAlvo: dinheiroParaCampo(doBanco),
      valorAtual: dinheiroParaCampo('2500.50'),
    })

    assert.equal(saida.success, true)
    if (!saida.success) return
    assert.equal(saida.data.valorAlvo, '15000.00')
    assert.equal(saida.data.valorAtual, '2500.50')
  })

  it('trata valor ausente como campo vazio', () => {
    assert.equal(dinheiroParaCampo(null), '')
    assert.equal(dinheiroParaCampo(undefined), '')
  })
})
