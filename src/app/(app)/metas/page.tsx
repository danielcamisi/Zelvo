import type { Metadata } from 'next'
import Link from 'next/link'
import CartaoMeta from '@/components/CartaoMeta'
import { IconeMais } from '@/components/Icones'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { contarMetasPorStatus, listarMetas } from '@/modulos/metas/consultas'

export const metadata: Metadata = { title: 'Metas · Zelvo' }

const FILTROS = [
  { valor: 'ativa', rotulo: 'Ativas' },
  { valor: 'concluida', rotulo: 'Concluídas' },
  { valor: 'arquivada', rotulo: 'Arquivadas' },
] as const

type Status = (typeof FILTROS)[number]['valor']

function statusValido(valor: string | undefined): Status {
  return FILTROS.some((filtro) => filtro.valor === valor) ? (valor as Status) : 'ativa'
}

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const usuario = await exigirUsuario()
  const status = statusValido((await searchParams).status)
  const [metas, contagem] = await Promise.all([
    listarMetas(usuario.id, status),
    contarMetasPorStatus(usuario.id),
  ])

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
        <Link
          href="/metas/nova"
          className="flex h-11 items-center gap-1.5 rounded-full bg-acento px-4 text-[14px] font-semibold text-fundo transition active:scale-[0.98]"
        >
          <IconeMais className="h-[18px] w-[18px]" />
          Nova
        </Link>
      </header>

      <nav aria-label="Filtrar metas por situação">
        <ul className="flex gap-1.5">
          {FILTROS.map((filtro) => {
            const atual = filtro.valor === status
            return (
              <li key={filtro.valor}>
                <Link
                  href={`/metas?status=${filtro.valor}`}
                  aria-current={atual ? 'page' : undefined}
                  className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${
                    atual
                      ? 'border-borda-forte bg-superficie-3 text-texto'
                      : 'border-borda text-tenue'
                  }`}
                >
                  {filtro.rotulo}
                  <span className="text-[12px] tabular-nums text-tenue">
                    {contagem[filtro.valor]}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {metas.length === 0 ? (
        <Vazio status={status} />
      ) : (
        <ul className="flex flex-col gap-3">
          {metas.map((meta) => (
            <CartaoMeta key={meta.id} meta={meta} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Vazio({ status }: { status: Status }) {
  if (status !== 'ativa') {
    return (
      <p className="rounded-3xl border border-borda bg-superficie p-5 text-[13px] leading-relaxed text-suave">
        Nada por aqui ainda.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-5">
      <p className="text-[13px] leading-relaxed text-suave">
        Uma meta é o objetivo; as tarefas são o que você faz toda semana para chegar lá. Comece
        pelo objetivo.
      </p>
      <Link
        href="/metas/nova"
        className="flex h-12 items-center justify-center rounded-2xl bg-acento text-[15px] font-semibold text-fundo transition active:scale-[0.99]"
      >
        Criar a primeira meta
      </Link>
    </div>
  )
}
