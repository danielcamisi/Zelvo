import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { dataNoFuso, diaDaSemana, diferencaEmDias, horaNoFuso, somarDias } from '../datas'
import { escolherMensagem, type MensagemFoco } from '../foco'
import { nivelPorXp, rankDoNivel, xpAcumuladoAteNivel, xpParaProximoNivel } from '../nivel'
import { progressoDaMeta } from '../progresso'
import { ocorreEm, ocorrenciasPrevistas, proximaOcorrencia, type TarefaRecorrente } from '../recorrencia'
import { calcularStreak } from '../streak'
import { bonusDeStreak, xpDaMeta, xpDaTarefa } from '../xp'

/* ------------------------------------------------------------------- xp */

describe('xp', () => {
  it('calcula a recompensa da meta por dificuldade e prioridade', () => {
    assert.equal(xpDaMeta('facil', 'baixa'), 100)
    assert.equal(xpDaMeta('media', 'alta'), 310) // 250 × 1.25 = 312.5 -> 310
    assert.equal(xpDaMeta('dificil', 'critica'), 750)
  })

  it('respeita o xp definido na mão, inclusive zero', () => {
    assert.equal(xpDaTarefa('baixa', 42), 42)
    assert.equal(xpDaTarefa('alta', 0), 0)
  })

  it('cai na prioridade quando não há xp manual', () => {
    assert.equal(xpDaTarefa('media', null), 10)
    assert.equal(xpDaTarefa('critica'), 35)
    assert.equal(xpDaTarefa('media', Number.NaN), 10)
    assert.equal(xpDaTarefa('media', -5), 10)
  })

  it('paga o bônus só quando a sequência fecha múltiplo de 7', () => {
    assert.equal(bonusDeStreak(6), 0)
    assert.equal(bonusDeStreak(7), 50)
    assert.equal(bonusDeStreak(14), 50)
    assert.equal(bonusDeStreak(0), 0)
  })
})

/* ---------------------------------------------------------------- nível */

describe('nivel', () => {
  it('bate com o número que o protótipo mostra', () => {
    // O protótipo diz "1.240 / 1.600 XP" no nível 7.
    assert.equal(xpParaProximoNivel(7), 1600)
  })

  it('vai e volta entre xp acumulado e nível, sem desencontro', () => {
    for (let nivel = 1; nivel <= 40; nivel += 1) {
      const naBorda = xpAcumuladoAteNivel(nivel)
      assert.equal(nivelPorXp(naBorda).nivel, nivel, `borda do nível ${nivel}`)
      assert.equal(nivelPorXp(naBorda + 1).nivel, nivel, `logo acima do nível ${nivel}`)
      if (nivel > 1) {
        assert.equal(nivelPorXp(naBorda - 1).nivel, nivel - 1, `logo abaixo do nível ${nivel}`)
      }
    }
  })

  it('começa no nível 1 e nunca quebra com valor estranho', () => {
    assert.equal(nivelPorXp(0).nivel, 1)
    assert.equal(nivelPorXp(-500).nivel, 1)
    assert.equal(nivelPorXp(0).xpNoNivel, 0)
  })

  it('reporta o progresso dentro do nível', () => {
    const estado = nivelPorXp(xpAcumuladoAteNivel(7) + 1240)
    assert.equal(estado.nivel, 7)
    assert.equal(estado.xpNoNivel, 1240)
    assert.equal(estado.xpParaProximo, 1600)
    assert.equal(estado.progresso, 78)
    assert.equal(estado.rank, 'Construtor')
  })

  it('nomeia os ranks pelas faixas declaradas', () => {
    assert.equal(rankDoNivel(1), 'Iniciante')
    assert.equal(rankDoNivel(7), 'Construtor')
    assert.equal(rankDoNivel(9), 'Persistente')
    assert.equal(rankDoNivel(999), 'Lenda')
  })
})

/* ---------------------------------------------------------------- datas */

describe('datas', () => {
  it('resolve o dia do usuário, não o dia do servidor', () => {
    // 22/09 às 01:30 UTC ainda é 21/09 às 22:30 em São Paulo.
    // Esta é a linha que faz a tarefa das 22:30 cair no dia certo.
    const instante = new Date('2026-09-22T01:30:00Z')
    assert.equal(dataNoFuso(instante, 'UTC'), '2026-09-22')
    assert.equal(dataNoFuso(instante, 'America/Sao_Paulo'), '2026-09-21')
    assert.equal(horaNoFuso(instante, 'America/Sao_Paulo'), '22:30')
  })

  it('conta o dia da semana com segunda = 1 e domingo = 7', () => {
    assert.equal(diaDaSemana('2026-09-21'), 1) // segunda
    assert.equal(diaDaSemana('2026-09-27'), 7) // domingo
  })

  it('soma dias atravessando mês e ano', () => {
    assert.equal(somarDias('2026-09-30', 1), '2026-10-01')
    assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
    assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
  })

  it('mede diferença em dias nos dois sentidos', () => {
    assert.equal(diferencaEmDias('2026-09-22', '2026-09-21'), 1)
    assert.equal(diferencaEmDias('2026-09-21', '2026-09-22'), -1)
    assert.equal(diferencaEmDias('2026-09-21', '2026-09-21'), 0)
  })
})

/* ----------------------------------------------------------- recorrência */

describe('recorrencia', () => {
  const base = { inicioEm: '2026-09-01', ativa: true } as const

  it('diária vale todo dia dentro da vigência', () => {
    const t: TarefaRecorrente = { ...base, recorrencia: 'diaria' }
    assert.equal(ocorreEm(t, '2026-09-21'), true)
    assert.equal(ocorreEm(t, '2026-08-31'), false, 'antes do início')
  })

  it('respeita o fim da vigência e o desligamento', () => {
    const t: TarefaRecorrente = { ...base, recorrencia: 'diaria', fimEm: '2026-09-10' }
    assert.equal(ocorreEm(t, '2026-09-10'), true)
    assert.equal(ocorreEm(t, '2026-09-11'), false)
    assert.equal(ocorreEm({ ...t, ativa: false }, '2026-09-05'), false)
  })

  it('semanal só nos dias escolhidos', () => {
    const t: TarefaRecorrente = { ...base, recorrencia: 'semanal', recorrenciaDias: [1, 3, 5] }
    assert.equal(ocorreEm(t, '2026-09-21'), true) // segunda
    assert.equal(ocorreEm(t, '2026-09-22'), false) // terça
    assert.equal(ocorreEm(t, '2026-09-23'), true) // quarta
  })

  it('semanal sem dias repete o dia da semana em que começou', () => {
    const t: TarefaRecorrente = { inicioEm: '2026-09-01', recorrencia: 'semanal' } // terça
    assert.equal(ocorreEm(t, '2026-09-08'), true)
    assert.equal(ocorreEm(t, '2026-09-09'), false)
  })

  it('mensal no dia 31 não some nos meses curtos', () => {
    const t: TarefaRecorrente = { inicioEm: '2026-01-01', recorrencia: 'mensal', recorrenciaDias: [31] }
    assert.equal(ocorreEm(t, '2026-01-31'), true)
    assert.equal(ocorreEm(t, '2026-02-28'), true, 'cai no último dia de fevereiro')
    assert.equal(ocorreEm(t, '2026-02-27'), false)
    assert.equal(ocorreEm(t, '2026-04-30'), true, 'cai no último dia de abril')
  })

  it('anual em 29 de fevereiro cai no dia 28 em ano comum', () => {
    const t: TarefaRecorrente = { inicioEm: '2024-02-29', recorrencia: 'anual' }
    assert.equal(ocorreEm(t, '2028-02-29'), true, 'ano bissexto')
    assert.equal(ocorreEm(t, '2027-02-28'), true, 'ano comum')
    assert.equal(ocorreEm(t, '2027-03-01'), false)
  })

  it('única acontece só na data marcada', () => {
    const t: TarefaRecorrente = { ...base, recorrencia: 'unica', dataUnica: '2026-09-21' }
    assert.equal(ocorreEm(t, '2026-09-21'), true)
    assert.equal(ocorreEm(t, '2026-09-22'), false)
  })

  it('conta as ocorrências previstas num intervalo', () => {
    const diaria: TarefaRecorrente = { ...base, recorrencia: 'diaria' }
    assert.equal(ocorrenciasPrevistas(diaria, '2026-09-01', '2026-09-30'), 30)

    const tresPorSemana: TarefaRecorrente = { ...base, recorrencia: 'semanal', recorrenciaDias: [1, 3, 5] }
    assert.equal(ocorrenciasPrevistas(tresPorSemana, '2026-09-21', '2026-09-27'), 3)
  })

  it('acha a próxima ocorrência e devolve nulo quando a vigência acabou', () => {
    const t: TarefaRecorrente = { ...base, recorrencia: 'semanal', recorrenciaDias: [7] }
    assert.equal(proximaOcorrencia(t, '2026-09-21'), '2026-09-27')
    const encerrada: TarefaRecorrente = { ...t, fimEm: '2026-09-22' }
    assert.equal(proximaOcorrencia(encerrada, '2026-09-21'), null)
  })
})

/* ------------------------------------------------------------- progresso */

describe('progresso', () => {
  it('meta financeira mede dinheiro, não tarefa', () => {
    const meta = { dataInicio: '2026-01-01', valorAlvo: '5000.00', valorAtual: '2400.00' }
    assert.equal(progressoDaMeta(meta, [], [], '2026-09-21'), 48)
  })

  it('meta financeira nunca passa de 100', () => {
    const meta = { dataInicio: '2026-01-01', valorAlvo: 5000, valorAtual: 9000 }
    assert.equal(progressoDaMeta(meta, [], [], '2026-09-21'), 100)
  })

  it('meta de hábito compara o feito com o que já era devido', () => {
    const meta = { dataInicio: '2026-09-15', prazo: '2026-12-31' }
    const tarefa = { id: 't1', inicioEm: '2026-09-15', recorrencia: 'diaria' as const }
    // De 15 a 21 de setembro são 7 dias devidos; 5 concluídos.
    const conclusoes = ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-19', '2026-09-21'].map(
      (dataReferencia) => ({ tarefaId: 't1', dataReferencia }),
    )
    assert.equal(progressoDaMeta(meta, [tarefa], conclusoes, '2026-09-21'), 71)
  })

  it('não conta conclusão de outra meta nem fora do período', () => {
    const meta = { dataInicio: '2026-09-20', prazo: '2026-09-21' }
    const tarefa = { id: 't1', inicioEm: '2026-09-20', recorrencia: 'diaria' as const }
    const conclusoes = [
      { tarefaId: 't1', dataReferencia: '2026-09-20' },
      { tarefaId: 'outra', dataReferencia: '2026-09-21' },
      { tarefaId: 't1', dataReferencia: '2026-09-19' },
    ]
    assert.equal(progressoDaMeta(meta, [tarefa], conclusoes, '2026-09-21'), 50)
  })

  it('para de contar depois do prazo', () => {
    const meta = { dataInicio: '2026-09-01', prazo: '2026-09-02' }
    const tarefa = { id: 't1', inicioEm: '2026-09-01', recorrencia: 'diaria' as const }
    const conclusoes = [
      { tarefaId: 't1', dataReferencia: '2026-09-01' },
      { tarefaId: 't1', dataReferencia: '2026-09-02' },
    ]
    assert.equal(progressoDaMeta(meta, [tarefa], conclusoes, '2026-12-31'), 100)
  })

  it('devolve zero sem tarefa e sem valor', () => {
    assert.equal(progressoDaMeta({ dataInicio: '2026-09-01' }, [], [], '2026-09-21'), 0)
  })
})

/* ---------------------------------------------------------------- streak */

describe('streak', () => {
  it('conta dias seguidos terminando hoje', () => {
    const dias = ['2026-09-19', '2026-09-20', '2026-09-21']
    assert.deepEqual(calcularStreak(dias, '2026-09-21'), { atual: 3, melhor: 3 })
  })

  it('dá carência para hoje: ontem ainda segura a sequência', () => {
    const dias = ['2026-09-19', '2026-09-20']
    assert.deepEqual(calcularStreak(dias, '2026-09-21'), { atual: 2, melhor: 2 })
  })

  it('quebra quando um dia passa em branco', () => {
    const dias = ['2026-09-18', '2026-09-19']
    assert.equal(calcularStreak(dias, '2026-09-21').atual, 0)
    assert.equal(calcularStreak(dias, '2026-09-21').melhor, 2)
  })

  it('guarda a melhor sequência mesmo depois de quebrar', () => {
    const dias = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-20', '2026-09-21']
    assert.deepEqual(calcularStreak(dias, '2026-09-21'), { atual: 2, melhor: 4 })
  })

  it('ignora dia repetido', () => {
    const dias = ['2026-09-20', '2026-09-20', '2026-09-21']
    assert.equal(calcularStreak(dias, '2026-09-21').atual, 2)
  })

  it('sem conclusão nenhuma, tudo zero', () => {
    assert.deepEqual(calcularStreak([], '2026-09-21'), { atual: 0, melhor: 0 })
  })
})

/* ------------------------------------------------------------------ foco */

describe('foco', () => {
  const catalogo: MensagemFoco[] = [
    { tom: 'sincero', evento: 'pendente', texto: 'A' },
    { tom: 'sincero', evento: 'pendente', texto: 'B' },
    { tom: 'sincero', evento: 'conclusao', texto: 'C' },
    { tom: 'agressivo', evento: 'pendente', texto: 'D' },
  ]

  it('filtra por tom e evento', () => {
    assert.equal(escolherMensagem(catalogo, 'agressivo', 'pendente', 'x'), 'D')
    assert.equal(escolherMensagem(catalogo, 'sincero', 'conclusao', 'x'), 'C')
  })

  it('é estável para a mesma semente e varia entre sementes', () => {
    const a = escolherMensagem(catalogo, 'sincero', 'pendente', '2026-09-21')
    const b = escolherMensagem(catalogo, 'sincero', 'pendente', '2026-09-21')
    assert.equal(a, b)

    const sementes = ['1', '2', '3', '4', '5', '6', '7', '8']
    const vistas = new Set(sementes.map((s) => escolherMensagem(catalogo, 'sincero', 'pendente', s)))
    assert.ok(vistas.size > 1, 'sementes diferentes deveriam alcançar frases diferentes')
  })

  it('devolve nulo quando não há mensagem para a combinação', () => {
    assert.equal(escolherMensagem(catalogo, 'level', 'resumo', 'x'), null)
  })
})
