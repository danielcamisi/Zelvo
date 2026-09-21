'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Ação destrutiva em dois toques.
 *
 * Excluir uma meta leva junto as tarefas e todo o histórico de conclusões,
 * por cascata no banco, e nada disso volta. Um único toque não pode bastar —
 * ainda mais num celular, onde o dedo erra o alvo.
 */

function Confirmar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 flex-1 rounded-2xl border border-borda-forte bg-superficie-3 text-[14px] font-semibold text-texto transition active:scale-[0.99] disabled:text-suave"
    >
      {pending ? 'Excluindo…' : rotulo}
    </button>
  )
}

export default function BotaoPerigo({
  acao,
  ocultos,
  rotulo,
  confirmacao,
  explicacao,
}: {
  acao: (formulario: FormData) => Promise<void>
  /** Campos que a Server Action precisa, como o id do registro. */
  ocultos: Record<string, string>
  rotulo: string
  confirmacao: string
  explicacao: string
}) {
  const [perguntando, setPerguntando] = useState(false)

  if (!perguntando) {
    return (
      <button
        type="button"
        onClick={() => setPerguntando(true)}
        className="h-12 w-full rounded-2xl border border-borda text-[14px] font-medium text-suave transition active:bg-superficie-2"
      >
        {rotulo}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-borda-forte bg-superficie-2 p-4">
      <p className="text-[13px] leading-relaxed text-suave">{explicacao}</p>
      <form action={acao} className="flex gap-2">
        {Object.entries(ocultos).map(([nome, valor]) => (
          <input key={nome} type="hidden" name={nome} value={valor} />
        ))}
        <button
          type="button"
          onClick={() => setPerguntando(false)}
          className="h-12 flex-1 rounded-2xl border border-borda text-[14px] font-medium text-suave transition active:bg-superficie-3"
        >
          Cancelar
        </button>
        <Confirmar rotulo={confirmacao} />
      </form>
    </div>
  )
}
