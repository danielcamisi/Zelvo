'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A comemoração de XP.
 *
 * Sobe de baixo da tela, para no meio, conta de 1 até o XP ganho e some. O
 * contador é feito em `requestAnimationFrame` e não em `setInterval`: o
 * intervalo perde quadros no celular e a contagem fica travando.
 *
 * Nada aqui é clicável — a camada é `pointer-events-none` para que um toque
 * durante a animação continue valendo para a lista embaixo.
 */

function querMenosMovimento(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function AnimacaoXp({
  xp,
  bonus,
  subiuDeNivel,
  nivel,
  rank,
  aoTerminar,
}: {
  xp: number
  bonus: number
  subiuDeNivel: boolean
  nivel: number
  rank: string
  aoTerminar: () => void
}) {
  const [valor, setValor] = useState(0)
  const [saindo, setSaindo] = useState(false)
  // Em `ref` para o efeito não reiniciar a animação toda vez que o pai
  // renderiza com uma função nova.
  const terminar = useRef(aoTerminar)
  terminar.current = aoTerminar

  useEffect(() => {
    const reduzido = querMenosMovimento()
    const contagem = reduzido ? 0 : Math.min(1200, Math.max(450, xp * 45))
    const espera = reduzido ? 700 : 520

    let quadro = 0
    const inicio = performance.now()

    function passo(agora: number) {
      const t = contagem === 0 ? 1 : Math.min(1, (agora - inicio) / contagem)
      // Desacelera no fim: o número "assenta" no valor final em vez de parar seco.
      const suave = 1 - (1 - t) ** 3
      setValor(Math.max(1, Math.round(xp * suave)))
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)

    const paraSair = setTimeout(() => setSaindo(true), contagem + espera)
    const fim = setTimeout(() => terminar.current(), contagem + espera + 400)

    return () => {
      cancelAnimationFrame(quadro)
      clearTimeout(paraSair)
      clearTimeout(fim)
    }
  }, [xp])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-8"
    >
      <div
        className={`flex flex-col items-center gap-2 rounded-[32px] border border-borda-forte bg-superficie/95 px-10 py-8 backdrop-blur ${
          saindo ? 'zelvo-xp-sai' : 'zelvo-xp-entra'
        }`}
      >
        <span
          className="text-[56px] leading-none font-bold tabular-nums text-texto"
          style={{ fontFamily: 'var(--fonte-display), sans-serif' }}
        >
          +{valor}
        </span>
        <span className="text-[13px] tracking-[0.08em] text-suave uppercase">
          {valor === 1 ? 'XP conquistado' : 'XP conquistados'}
        </span>

        {bonus > 0 ? (
          <span className="mt-1 rounded-full bg-superficie-3 px-3 py-1 text-[12px] text-suave">
            inclui {bonus} de bônus de sequência
          </span>
        ) : null}

        {subiuDeNivel ? (
          <span className="mt-2 border-t border-borda pt-3 text-center text-[15px] font-semibold text-texto">
            Nível {nivel}
            <span className="block text-[12px] font-normal text-suave">{rank}</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}
