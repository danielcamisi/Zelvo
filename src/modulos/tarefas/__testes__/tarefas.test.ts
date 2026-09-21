import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { errosPorCampo } from '../../comum/formulario'
import { ocorreEm } from '../../../regras/recorrencia'
import { descreverRecorrencia, esquemaTarefa } from '../validacao'
import { tarefaEmBranco, tarefaEmCampos } from '../formulario'

const BASE = {
  titulo: 'Tomar creatina',
  descricao: '',
  horario: '08:30',
  recorrencia: 'diaria',
  recorrenciaDias: [],
  dataUnica: '',
  inicioEm: '2026-09-21',
  fimEm: '',
  prioridade: 'media',
  xp: '',
}

function erros(entrada: Record<string, unknown>) {
  const saida = esquemaTarefa.safeParse(entrada)
  return saida.success ? {} : errosPorCampo(saida.error)
}

function valida(entrada: Record<string, unknown>) {
  const saida = esquemaTarefa.safeParse(entrada)
  assert.equal(saida.success, true, JSON.stringify(saida.success ? {} : errosPorCampo(saida.error)))
  if (!saida.success) throw new Error('inalcançável')
  return saida.data
}

describe('validação de tarefa', () => {
  it('aceita a tarefa diária e deriva o XP da prioridade', () => {
    const dados = valida(BASE)
    assert.equal(dados.horario, '08:30')
    assert.equal(dados.xpFinal, 10)
    // Diária não usa dias: guardar lista vazia deixaria lixo no banco.
    assert.equal(dados.recorrenciaDias, null)
  })

  it('respeita o XP manual quando informado', () => {
    assert.equal(valida({ ...BASE, prioridade: 'baixa', xp: '42' }).xpFinal, 42)
    assert.match(erros({ ...BASE, xp: '900' }).xp ?? '', /entre 0 e 500/)
  })

  it('exige o dia da tarefa única', () => {
    assert.match(erros({ ...BASE, recorrencia: 'unica' }).dataUnica ?? '', /Escolha o dia/)
  })

  it('exige dias válidos na semanal e na mensal', () => {
    assert.match(
      erros({ ...BASE, recorrencia: 'semanal' }).recorrenciaDias ?? '',
      /pelo menos um dia da semana/,
    )
    assert.match(
      erros({ ...BASE, recorrencia: 'semanal', recorrenciaDias: ['9'] }).recorrenciaDias ?? '',
      /Dia da semana inválido/,
    )
    assert.match(
      erros({ ...BASE, recorrencia: 'mensal', recorrenciaDias: ['0'] }).recorrenciaDias ?? '',
      /entre 1 e 31/,
    )
  })

  it('normaliza os dias: sem repetição e em ordem', () => {
    const dados = valida({ ...BASE, recorrencia: 'semanal', recorrenciaDias: ['3', '1', '3'] })
    assert.deepEqual(dados.recorrenciaDias, [1, 3])
  })

  it('recusa fim antes do início e horário inválido', () => {
    assert.match(erros({ ...BASE, fimEm: '2026-09-20' }).fimEm ?? '', /antes do início/)
    assert.match(erros({ ...BASE, horario: '25:00' }).horario ?? '', /Horário inválido/)
  })

  it('puxa o início para o dia escolhido na tarefa única', () => {
    // `ocorreEm` ignora qualquer data anterior a `inicioEm`. Sem esta
    // normalização, uma tarefa marcada para antes do início nunca apareceria
    // — e o usuário não teria como saber por quê.
    const dados = valida({
      ...BASE,
      recorrencia: 'unica',
      inicioEm: '2026-09-21',
      dataUnica: '2026-09-15',
    })

    assert.equal(dados.inicioEm, '2026-09-15')
    assert.equal(ocorreEm({ ...dados, recorrencia: 'unica' }, '2026-09-15'), true)
  })

  it('o que sai da validação é aceito pelas regras de recorrência', () => {
    const semanal = valida({ ...BASE, recorrencia: 'semanal', recorrenciaDias: ['1', '4'] })
    // 21/09/2026 é uma segunda-feira.
    assert.equal(ocorreEm({ ...semanal, recorrencia: 'semanal' }, '2026-09-21'), true)
    assert.equal(ocorreEm({ ...semanal, recorrencia: 'semanal' }, '2026-09-22'), false)
    assert.equal(ocorreEm({ ...semanal, recorrencia: 'semanal' }, '2026-09-24'), true)
  })
})

describe('resumo da repetição', () => {
  it('descreve cada tipo em português', () => {
    assert.equal(descreverRecorrencia({ recorrencia: 'diaria' }), 'Todo dia')
    assert.equal(descreverRecorrencia({ recorrencia: 'unica' }), 'Uma vez')
    assert.equal(
      descreverRecorrencia({ recorrencia: 'semanal', recorrenciaDias: [1, 3, 5] }),
      'seg, qua, sex',
    )
    assert.equal(
      descreverRecorrencia({ recorrencia: 'mensal', recorrenciaDias: [5, 20] }),
      'Todo mês, dia 5, 20',
    )
    // Sete dias marcados é "todo dia", não a lista inteira.
    assert.equal(
      descreverRecorrencia({ recorrencia: 'semanal', recorrenciaDias: [1, 2, 3, 4, 5, 6, 7] }),
      'Todo dia',
    )
  })
})

describe('tarefa do banco de volta ao formulário', () => {
  const LINHA = {
    id: 'tarefa-1',
    metaId: 'meta-1',
    usuarioId: 'usuario-1',
    titulo: 'Treino de perna',
    descricao: null,
    // O `time` do Postgres volta com segundos; `<input type="time">` não os aceita.
    horario: '18:30:00',
    recorrencia: 'semanal' as const,
    recorrenciaDias: [1, 4],
    dataUnica: null,
    inicioEm: '2026-09-21',
    fimEm: null,
    prioridade: 'alta' as const,
    xp: 40,
    ativa: true,
    criadaEm: new Date('2026-09-21T12:00:00Z'),
  }

  it('preenche a edição sem perder nada e revalida igual', () => {
    const campos = tarefaEmCampos(LINHA)
    assert.equal(campos.horario, '18:30')
    assert.deepEqual(campos.recorrenciaDias, [1, 4])
    assert.equal(campos.xp, '40')

    const saida = esquemaTarefa.safeParse({ ...campos, recorrenciaDias: ['1', '4'] })
    assert.equal(saida.success, true)
    if (!saida.success) return
    assert.equal(saida.data.horario, '18:30')
    assert.deepEqual(saida.data.recorrenciaDias, [1, 4])
    // XP preenchido é XP mantido: a edição não recalcula pela prioridade.
    assert.equal(saida.data.xpFinal, 40)
  })

  it('começa uma tarefa nova no dia informado', () => {
    const campos = tarefaEmBranco('2026-09-21', 'meta-1')
    assert.equal(campos.recorrencia, 'unica')
    assert.equal(campos.dataUnica, '2026-09-21')
    assert.equal(campos.metaId, 'meta-1')
    assert.equal(campos.xp, '')
  })
})
