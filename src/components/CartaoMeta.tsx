import Link from 'next/link'
import { CATEGORIAS, PRIORIDADES, dataCurta, dinheiro } from '@/modulos/comum/rotulos'
import type { MetaDaLista } from '@/modulos/metas/consultas'

/**
 * A meta na lista.
 *
 * O cartão inteiro é o link: no celular, mirar num título de 15px é pedir
 * demais. Sem cor por categoria — a paleta é monocromática, então categoria
 * e prioridade aparecem como texto.
 */
export default function CartaoMeta({ meta }: { meta: MetaDaLista }) {
  const progresso = progressoFinanceiro(meta)

  return (
    <li>
      <Link
        href={`/metas/${meta.id}`}
        className="flex flex-col gap-3 rounded-3xl border border-borda bg-superficie p-4 transition active:bg-superficie-2"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-[15px] font-semibold text-texto">{meta.titulo}</span>
          <span className="shrink-0 rounded-full bg-superficie-2 px-2.5 py-1 text-[11px] text-suave">
            {CATEGORIAS[meta.categoria]}
          </span>
        </div>

        {progresso ? (
          <div className="flex flex-col gap-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-superficie-3"
              role="progressbar"
              aria-valuenow={progresso.porcento}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso financeiro da meta"
            >
              <div className="h-full rounded-full bg-acento" style={{ width: `${progresso.porcento}%` }} />
            </div>
            <span className="text-[12px] text-tenue">
              {dinheiro(meta.valorAtual)} de {dinheiro(meta.valorAlvo)}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-tenue">
          <span>Prioridade {PRIORIDADES[meta.prioridade].toLowerCase()}</span>
          <span>
            {meta.totalTarefas === 0
              ? 'Sem tarefas'
              : `${meta.totalTarefas} ${meta.totalTarefas === 1 ? 'tarefa' : 'tarefas'}`}
          </span>
          {meta.prazo ? <span>Prazo {dataCurta(meta.prazo)}</span> : null}
          <span>{meta.xpRecompensa} XP</span>
        </div>
      </Link>
    </li>
  )
}

/**
 * Só metas financeiras têm barra de progresso. Alvo zero não vira divisão
 * por zero, e passar do alvo não estoura a barra.
 */
function progressoFinanceiro(meta: MetaDaLista) {
  if (!meta.valorAlvo) return null
  const alvo = Number(meta.valorAlvo)
  if (!Number.isFinite(alvo) || alvo <= 0) return null

  const atual = Number(meta.valorAtual ?? 0)
  const bruto = (Number.isFinite(atual) ? atual : 0) / alvo
  return { porcento: Math.min(100, Math.max(0, Math.round(bruto * 100))) }
}
