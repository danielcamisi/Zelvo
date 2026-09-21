import Link from 'next/link'
import Avatar from '@/components/Avatar'
import NavegacaoInferior from '@/components/NavegacaoInferior'
import { IconeConfiguracoes } from '@/components/Icones'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { nivelPorXp } from '@/regras/nivel'

// Nada aqui dentro pode ser pré-renderizado: toda página depende de quem
// está logado.
export const dynamic = 'force-dynamic'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario()
  // Nível e rank saem sempre do XP, nunca das colunas `nivel`/`rank`: são as
  // mesmas contas que Hoje e Perfil fazem, e derivar nos três lugares impede
  // que o cabeçalho mostre um nível e o cartão da tela mostre outro.
  const { nivel, rank } = nivelPorXp(usuario.xpTotal)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-borda px-5 pt-8 pb-4">
        {/* A foto de perfil é o caminho para o perfil; o nome ao lado faz
            parte do mesmo alvo de toque, para não exigir mira no celular. */}
        <Link
          href="/perfil"
          className="flex min-w-0 items-center gap-3 rounded-2xl pr-2 text-left"
        >
          <Avatar nome={usuario.nome} url={usuario.avatarUrl} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold text-texto">{usuario.nome}</span>
            <span className="truncate text-[12px] text-tenue">
              Nível {nivel} · {rank}
            </span>
          </span>
        </Link>

        <Link
          href="/configuracoes"
          aria-label="Configurações do app"
          title="Configurações do app"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-borda text-suave transition active:bg-superficie-2"
        >
          <IconeConfiguracoes className="h-[21px] w-[21px]" />
        </Link>
      </header>

      <main className="flex-1 px-5 pt-6 pb-28">{children}</main>

      <NavegacaoInferior />
    </div>
  )
}
