'use client'

import { useEffect, useState } from 'react'
import { TEMAS, type Tema, aplicarTema, temaSalvo } from '@/modulos/comum/tema'

/**
 * Escolha do tema: Sistema, Claro ou Escuro.
 *
 * O estado só é lido depois de montar. Ler o `localStorage` na renderização
 * faria o servidor e o cliente discordarem do botão marcado, e o React
 * reclamaria de hidratação — por isso "Sistema" é o que aparece no primeiro
 * quadro, que é justamente o padrão.
 */
export default function SeletorDeTema() {
  const [tema, setTema] = useState<Tema>('sistema')

  useEffect(() => {
    setTema(temaSalvo())
  }, [])

  function escolher(valor: Tema) {
    setTema(valor)
    aplicarTema(valor)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema do aplicativo"
      className="grid grid-cols-3 gap-1 rounded-2xl border border-borda bg-superficie p-1"
    >
      {TEMAS.map(({ valor, rotulo }) => {
        const marcado = tema === valor
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => escolher(valor)}
            className={`h-11 rounded-xl text-[14px] font-semibold transition ${
              marcado ? 'bg-superficie-3 text-texto' : 'text-tenue'
            }`}
          >
            {rotulo}
          </button>
        )
      })}
    </div>
  )
}
