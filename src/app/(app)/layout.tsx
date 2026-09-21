import Link from 'next/link'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { sair } from '@/modulos/auth/acoes'

const ABAS = [
  { href: '/hoje', rotulo: 'Hoje' },
  { href: '/instalar', rotulo: 'Instalar' },
]

// Nada aqui dentro pode ser pré-renderizado: toda página depende de quem
// está logado.
export const dynamic = 'force-dynamic'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <header className="flex items-center justify-between gap-3 px-6 pt-10 pb-5">
        <div className="flex flex-col">
          <span className="text-[13px] text-suave">Olá,</span>
          <span className="text-lg font-semibold">{usuario.nome}</span>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-xl border border-borda px-3 py-2 text-[13px] text-suave"
          >
            Sair
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] gap-2 border-t border-borda bg-fundo/95 px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur">
        {ABAS.map((aba) => (
          <Link
            key={aba.href}
            href={aba.href}
            className="flex-1 rounded-xl bg-superficie py-2.5 text-center text-[13px] font-medium text-texto"
          >
            {aba.rotulo}
          </Link>
        ))}
      </nav>
    </div>
  )
}
