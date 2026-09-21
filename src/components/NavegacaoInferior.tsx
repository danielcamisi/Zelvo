'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconeHoje, IconeMetas, IconePerfil, IconeTarefas } from './Icones'

/**
 * Barra de abas do app. Cliente só por causa do `usePathname`: sem marcar a
 * aba atual, o usuário não sabe onde está.
 *
 * "Instalar" saiu daqui de propósito — instalação e notificações são ajuste
 * de configuração, não destino do dia a dia, e agora moram em
 * /configuracoes.
 */
const ABAS = [
  { href: '/hoje', rotulo: 'Hoje', Icone: IconeHoje },
  { href: '/metas', rotulo: 'Metas', Icone: IconeMetas },
  { href: '/tarefas', rotulo: 'Tarefas', Icone: IconeTarefas },
  { href: '/perfil', rotulo: 'Perfil', Icone: IconePerfil },
]

export default function NavegacaoInferior() {
  const caminho = usePathname()

  return (
    <nav
      aria-label="Seções do app"
      className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] border-t border-borda bg-fundo/95 px-5 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur"
    >
      <ul className="flex gap-2">
        {ABAS.map(({ href, rotulo, Icone }) => {
          const atual = caminho === href || caminho.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={atual ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition ${
                  atual ? 'bg-superficie-2 text-texto' : 'text-tenue'
                }`}
              >
                <Icone className="h-[22px] w-[22px]" />
                {rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
