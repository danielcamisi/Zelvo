import Link from 'next/link'
import ConcluirTarefa from './ConcluirTarefa'
import { horaCurta } from '@/modulos/comum/rotulos'
import { descreverRecorrencia } from '@/modulos/tarefas/validacao'

/**
 * A tarefa na lista, igual em Hoje, em Tarefas e dentro da meta.
 *
 * O botão de concluir e o resto da linha são alvos separados: o botão marca,
 * o resto abre a edição. Fossem o mesmo, não haveria como abrir uma tarefa
 * sem concluí-la sem querer.
 *
 * O horário fica à esquerda, em coluna fixa, para as tarefas do dia se
 * lerem na vertical; sem horário, entra um traço no lugar, e não um vazio
 * que desalinha a lista.
 */
export type TarefaExibida = {
  id: string
  titulo: string
  horario: string | null
  recorrencia: string
  recorrenciaDias: number[] | null
  dataUnica: string | null
  xp: number
  ativa: boolean
  metaTitulo?: string | null
}

export default function ItemTarefa({
  tarefa,
  mostrarMeta = false,
  concluivel = false,
  concluida = false,
}: {
  tarefa: TarefaExibida
  /** Em Hoje e em Tarefas ajuda saber a que meta pertence; dentro da meta, não. */
  mostrarMeta?: boolean
  /** Só faz sentido quando a tarefa cai hoje: não se conclui um dia que não chegou. */
  concluivel?: boolean
  concluida?: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie py-3 pr-4 pl-3">
      {concluivel ? <ConcluirTarefa tarefaId={tarefa.id} concluida={concluida} /> : null}

      <Link
        href={`/tarefas/${tarefa.id}`}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-xl transition active:opacity-70"
      >
        <span
          className={`w-11 shrink-0 pt-0.5 text-[13px] tabular-nums ${
            tarefa.horario ? 'text-suave' : 'text-tenue'
          }`}
        >
          {tarefa.horario ? horaCurta(tarefa.horario) : '—'}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`text-[15px] font-medium ${
              concluida ? 'text-tenue line-through' : 'text-texto'
            }`}
          >
            {tarefa.titulo}
          </span>
          <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] text-tenue">
            <span>{descreverRecorrencia(tarefa)}</span>
            <span>{tarefa.xp} XP</span>
            {mostrarMeta && tarefa.metaTitulo ? <span>{tarefa.metaTitulo}</span> : null}
            {tarefa.ativa ? null : <span className="text-suave">Pausada</span>}
          </span>
        </span>
      </Link>
    </li>
  )
}
