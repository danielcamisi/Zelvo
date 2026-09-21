import type { Metadata } from 'next'
import Link from 'next/link'

import ItemTarefa from '@/components/ItemTarefa'
import { IconeMais } from '@/components/Icones'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { todasAsTarefas } from '@/modulos/tarefas/consultas'

export const metadata: Metadata = { title: 'Tarefas · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  const lista = await todasAsTarefas(usuario.id)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tarefas</h1>
        <Link
          href="/tarefas/nova"
          className="flex h-11 items-center gap-1.5 rounded-full bg-acento px-4 text-[14px] font-semibold text-fundo transition active:scale-[0.98]"
        >
          <IconeMais className="h-[18px] w-[18px]" />
          Nova
        </Link>
      </header>

      {lista.length === 0 ? (
        <p className="rounded-3xl border border-borda bg-superficie p-5 text-[13px] leading-relaxed text-suave">
          Nenhuma tarefa ainda. Tarefa é o que entra no seu dia: pode ser única, todo dia, em dias
          da semana ou em dias do mês.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((tarefa) => (
            <ItemTarefa key={tarefa.id} tarefa={tarefa} mostrarMeta />
          ))}
        </ul>
      )}
    </div>
  )
}
