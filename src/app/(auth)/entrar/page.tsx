import type { Metadata } from 'next'
import FormularioAuth from '@/components/FormularioAuth'

export const metadata: Metadata = { title: 'Entrar · Zelvo' }

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>
}) {
  const { proximo, erro } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-9 px-6 py-14">
      <header className="flex flex-col gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-acento text-fundo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
          </svg>
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--fonte-display), sans-serif' }}
        >
          ZELVO
        </h1>
        <p className="text-sm leading-relaxed text-suave">
          Organize sua vida. Alcance suas metas. Evolua.
        </p>
      </header>

      {erro === 'confirmacao' ? (
        <p className="rounded-2xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-[14px] text-alerta">
          O link de confirmação não valeu — ele expira e só funciona uma vez. Entre com e-mail e
          senha; se ainda não estiver confirmado, peça um link novo criando a conta de novo.
        </p>
      ) : null}

      <FormularioAuth proximo={proximo} />
    </main>
  )
}
