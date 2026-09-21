import { horaCurta } from '@/modulos/comum/rotulos'
import type { tarefas } from '@/db/schema'

/**
 * A ponte entre a linha do banco e os campos da tela.
 *
 * Existe porque os dois formatos não batem: `time` volta com segundos, os
 * dias vêm como array anulável e todo campo de texto de um `<input>`
 * controlado precisa ser string, nunca `null`.
 */

export type ValoresTarefa = {
  metaId: string
  titulo: string
  descricao: string
  horario: string
  recorrencia: string
  recorrenciaDias: number[]
  dataUnica: string
  inicioEm: string
  fimEm: string
  prioridade: string
  xp: string
}

export type MetaEscolhivel = { id: string; titulo: string }

/** Tarefa nova: cai em "uma vez", hoje, na meta de onde o usuário veio. */
export function tarefaEmBranco(hoje: string, metaId = ''): ValoresTarefa {
  return {
    metaId,
    titulo: '',
    descricao: '',
    horario: '',
    recorrencia: 'unica',
    recorrenciaDias: [],
    dataUnica: hoje,
    inicioEm: hoje,
    fimEm: '',
    prioridade: 'media',
    xp: '',
  }
}

export function tarefaEmCampos(tarefa: typeof tarefas.$inferSelect): ValoresTarefa {
  return {
    metaId: tarefa.metaId ?? '',
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? '',
    horario: horaCurta(tarefa.horario),
    recorrencia: tarefa.recorrencia,
    recorrenciaDias: tarefa.recorrenciaDias ?? [],
    dataUnica: tarefa.dataUnica ?? '',
    inicioEm: tarefa.inicioEm,
    fimEm: tarefa.fimEm ?? '',
    prioridade: tarefa.prioridade,
    // O XP fica sempre preenchido na edição: ele já existe na linha, e um
    // campo vazio aqui significaria "recalcular pela prioridade".
    xp: String(tarefa.xp),
  }
}
