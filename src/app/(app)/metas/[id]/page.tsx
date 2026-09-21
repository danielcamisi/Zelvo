import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import BotaoPerigo from '@/components/BotaoPerigo'
import ItemTarefa from '@/components/ItemTarefa'
import Voltar from '@/components/Voltar'
import { IconeMais } from '@/components/Icones'
import { exigirUsuario } from '@/modulos/auth/sessao'
import {
  CATEGORIAS,
  DIFICULDADES,
  PRIORIDADES,
  STATUS_META,
  VISIBILIDADES,
  dataCurta,
  dinheiro,
} from '@/modulos/comum/rotulos'
import { excluirMeta, mudarStatusDaMeta } from '@/modulos/metas/acoes'
import { buscarMeta, tarefasDaMeta } from '@/modulos/metas/consultas'

export const metadata: Metadata = { title: 'Meta · Zelvo' }

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const usuario = await exigirUsuario()
  const meta = await buscarMeta(usuario.id, id)
  // `buscarMeta` já filtra pelo dono, então meta de outra pessoa cai aqui
  // como inexistente — que é exatamente o que ela deve ser para quem pergunta.
  if (!meta) notFound()

  const tarefas = await tarefasDaMeta(usuario.id, meta.id)
  const financeira = meta.categoria === 'financas' && meta.valorAlvo

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Voltar href="/metas" rotulo="Metas" />
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{meta.titulo}</h1>
          <span className="mt-1 shrink-0 rounded-full bg-superficie-2 px-2.5 py-1 text-[11px] text-suave">
            {STATUS_META[meta.status]}
          </span>
        </div>
        {meta.descricao ? (
          <p className="text-[14px] leading-relaxed text-suave">{meta.descricao}</p>
        ) : null}
      </div>

      <section className="rounded-3xl border border-borda bg-superficie p-5">
        <h2 className="sr-only">Detalhes da meta</h2>
        <dl className="grid grid-cols-2 gap-3">
          <Dado rotulo="Categoria" valor={CATEGORIAS[meta.categoria]} />
          <Dado rotulo="Prioridade" valor={PRIORIDADES[meta.prioridade]} />
          <Dado rotulo="Dificuldade" valor={DIFICULDADES[meta.dificuldade]} />
          <Dado rotulo="Recompensa" valor={`${meta.xpRecompensa} XP`} />
          <Dado rotulo="Início" valor={dataCurta(meta.dataInicio)} />
          <Dado rotulo="Prazo" valor={meta.prazo ? dataCurta(meta.prazo) : 'Sem prazo'} />
        </dl>

        {financeira ? (
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <Dado rotulo="Já tenho" valor={dinheiro(meta.valorAtual) || 'R$ 0,00'} />
            <Dado rotulo="Quero chegar a" valor={dinheiro(meta.valorAlvo)} />
          </dl>
        ) : null}

        <p className="mt-4 text-[12px] text-tenue">
          Visibilidade: {VISIBILIDADES[meta.visibilidade].toLowerCase()}.
          {financeira ? ' Valores em dinheiro nunca ficam públicos.' : ''}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-tight">Tarefas</h2>
          <Link
            href={`/metas/${meta.id}/tarefas/nova`}
            className="flex h-10 items-center gap-1.5 rounded-full border border-borda px-3.5 text-[13px] font-medium text-suave transition active:bg-superficie-2"
          >
            <IconeMais className="h-4 w-4" />
            Nova tarefa
          </Link>
        </div>

        {tarefas.length === 0 ? (
          <p className="rounded-2xl border border-borda bg-superficie px-4 py-3.5 text-[13px] leading-relaxed text-suave">
            Sem tarefas ainda. A meta é o objetivo; as tarefas é que aparecem no seu dia.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tarefas.map((tarefa) => (
              <ItemTarefa key={tarefa.id} tarefa={tarefa} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Situação</h2>

        <Link
          href={`/metas/${meta.id}/editar`}
          className="flex h-12 items-center justify-center rounded-2xl border border-borda text-[14px] font-medium text-texto transition active:bg-superficie-2"
        >
          Editar meta
        </Link>

        {/* Arquivar é o caminho normal para tirar uma meta da frente:
            preserva tarefas e histórico. Excluir é o último recurso. */}
        {meta.status === 'ativa' ? (
          <div className="grid grid-cols-2 gap-2">
            <BotaoStatus metaId={meta.id} status="concluida" rotulo="Concluir" />
            <BotaoStatus metaId={meta.id} status="arquivada" rotulo="Arquivar" />
          </div>
        ) : (
          <BotaoStatus metaId={meta.id} status="ativa" rotulo="Reabrir meta" />
        )}

        <BotaoPerigo
          acao={excluirMeta}
          ocultos={{ metaId: meta.id }}
          rotulo="Excluir meta"
          confirmacao="Excluir de vez"
          explicacao={
            tarefas.length > 0
              ? `Isso apaga a meta, ${tarefas.length === 1 ? 'a tarefa dela' : `as ${tarefas.length} tarefas dela`} e todo o histórico de conclusões. Não dá para desfazer. Para só tirar da frente, arquive.`
              : 'Isso apaga a meta e todo o histórico dela. Não dá para desfazer. Para só tirar da frente, arquive.'
          }
        />
      </section>
    </div>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-superficie-2 px-4 py-3">
      <dt className="text-[11px] tracking-[0.08em] text-tenue uppercase">{rotulo}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-texto">{valor}</dd>
    </div>
  )
}

function BotaoStatus({
  metaId,
  status,
  rotulo,
}: {
  metaId: string
  status: 'ativa' | 'concluida' | 'arquivada'
  rotulo: string
}) {
  return (
    <form action={mudarStatusDaMeta}>
      <input type="hidden" name="metaId" value={metaId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="h-12 w-full rounded-2xl border border-borda text-[14px] font-medium text-texto transition active:bg-superficie-2"
      >
        {rotulo}
      </button>
    </form>
  )
}
