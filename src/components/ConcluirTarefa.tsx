'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import AnimacaoXp from './AnimacaoXp'
import { IconeVisto } from './Icones'
import { concluirTarefa, desfazerConclusao } from '@/modulos/conclusoes/acoes'

/**
 * O botão de concluir, ao lado da tarefa.
 *
 * Alterna: um toque conclui, outro desfaz. Desfazer existe porque a lista é
 * apertada no celular e um toque errado não pode virar XP permanente.
 *
 * A marcação muda na hora, antes da resposta do servidor. Se a resposta vier
 * negativa, o estado volta e o motivo aparece — é mais honesto do que deixar
 * o dedo esperando meio segundo a cada tarefa.
 */

type Festa = {
  xp: number
  bonus: number
  subiuDeNivel: boolean
  nivel: number
  rank: string
}

export default function ConcluirTarefa({
  tarefaId,
  concluida,
}: {
  tarefaId: string
  concluida: boolean
}) {
  const router = useRouter()
  const [marcada, setMarcada] = useState(concluida)
  const [ocupado, setOcupado] = useState(false)
  const [festa, setFesta] = useState<Festa | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Depois de um `router.refresh()` a lista volta com a verdade do servidor.
  useEffect(() => {
    setMarcada(concluida)
  }, [concluida])

  useEffect(() => {
    if (!erro) return
    const relogio = setTimeout(() => setErro(null), 3500)
    return () => clearTimeout(relogio)
  }, [erro])

  async function alternar() {
    if (ocupado) return
    const desfazendo = marcada

    setOcupado(true)
    setErro(null)
    setMarcada(!desfazendo)

    const resposta = desfazendo
      ? await desfazerConclusao(tarefaId)
      : await concluirTarefa(tarefaId)

    setOcupado(false)

    if (!resposta.ok) {
      setMarcada(desfazendo)
      setErro(resposta.motivo)
      // O servidor pode estar certo e a tela errada (outra aba, outro
      // aparelho); buscar de novo resolve sem o usuário ter de recarregar.
      router.refresh()
      return
    }

    if (desfazendo) {
      router.refresh()
      return
    }

    setFesta({
      xp: resposta.xpGanho,
      bonus: resposta.bonus,
      subiuDeNivel: resposta.nivelDepois > resposta.nivelAntes,
      nivel: resposta.nivelDepois,
      rank: resposta.rank,
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        aria-pressed={marcada}
        aria-label={marcada ? 'Desfazer conclusão da tarefa' : 'Concluir tarefa'}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition active:scale-95 ${
          marcada
            ? 'border-acento bg-acento text-fundo'
            : 'border-borda-forte text-tenue active:bg-superficie-2'
        } ${ocupado ? 'opacity-60' : ''}`}
      >
        <IconeVisto className="h-[18px] w-[18px]" />
      </button>

      {festa ? (
        <AnimacaoXp
          {...festa}
          aoTerminar={() => {
            setFesta(null)
            // Só agora a barra de XP e o nível no cabeçalho mudam: primeiro a
            // comemoração, depois o número novo.
            router.refresh()
          }}
        />
      ) : null}

      {erro ? (
        <p
          role="alert"
          className="fixed inset-x-5 bottom-28 z-50 mx-auto max-w-[390px] rounded-2xl border border-borda-forte bg-superficie-2 px-4 py-3 text-center text-[13px] text-texto"
        >
          {erro}
        </p>
      ) : null}
    </>
  )
}
