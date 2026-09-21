import Link from 'next/link'
import { horaCurta } from '@/modulos/comum/rotulos'
import { descreverRecorrencia } from '@/modulos/tarefas/validacao'

/**
 * A tarefa na lista, igual em Hoje, em Tarefas e dentro da meta.
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
}: {
  tarefa: TarefaExibida
  /** Em Hoje e em Tarefas ajuda saber a que meta pertence; dentro da meta, não. */
  mostrarMeta?: boolean
}) {
  return (
    <li>
      <Link
        href={`/tarefas/${tarefa.id}`}
        className="flex items-start gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3.5 transition active:bg-superficie-2"
      >
        <span
          className={`w-11 shrink-0 pt-0.5 text-[13px] tabular-nums ${
            tarefa.horario ? 'text-suave' : 'text-tenue'
          }`}
        >
          {tarefa.horario ? horaCurta(tarefa.horario) : '—'}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[15px] font-medium text-texto">{tarefa.titulo}</span>
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
