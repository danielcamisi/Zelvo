import type { Metadata } from 'next'
import Aviso from '@/components/Aviso'
import FormularioAuth from '@/components/FormularioAuth'
import { MarcaZelvo } from '@/components/Icones'

export const metadata: Metadata = { title: 'Entrar · Zelvo' }

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>
}) {
  const { proximo, erro } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-8 px-6 py-14">
      <header className="flex flex-col gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-acento text-fundo">
          <MarcaZelvo />
        </div>
        <h1
          className="text-[34px] leading-none font-bold tracking-[0.02em]"
          style={{ fontFamily: 'var(--fonte-display), sans-serif' }}
        >
          ZELVO
        </h1>
        <p className="text-[14px] leading-relaxed text-suave">
          Organize sua vida. Alcance suas metas. Evolua.
        </p>
      </header>

      {erro === 'confirmacao' ? (
        <Aviso tipo="erro" titulo="Link de confirmação inválido">
          O link expira e só pode ser usado uma vez. Entre com e-mail e senha; se a conta ainda
          não estiver confirmada, crie a conta novamente para receber um link novo.
        </Aviso>
      ) : null}

      <FormularioAuth proximo={proximo} />
    </main>
  )
}
