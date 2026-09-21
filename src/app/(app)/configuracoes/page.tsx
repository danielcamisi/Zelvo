import type { Metadata } from 'next'
import PainelPush from '@/components/PainelPush'
import { IconeSair } from '@/components/Icones'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { sair } from '@/modulos/auth/acoes'

export const metadata: Metadata = { title: 'Configurações · Zelvo' }

/**
 * Tela de ajustes do app. É onde mora a instalação na tela de início e o
 * teste de notificação, que antes ocupavam uma aba no rodapé: são coisas
 * que se resolvem uma vez, não destinos do dia a dia.
 */
export default async function Pagina() {
  const usuario = await exigirUsuario()

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-[13px] leading-relaxed text-suave">
          Ajustes do aplicativo e da sua conta.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-semibold tracking-[0.12em] text-tenue uppercase">
            Instalação e notificações
          </h2>
          <p className="text-[13px] leading-relaxed text-suave">
            Instale o Zelvo na tela de início do iPhone e autorize as notificações. Sem isso os
            lembretes não chegam ao aparelho.
          </p>
        </div>
        <PainelPush />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold tracking-[0.12em] text-tenue uppercase">Conta</h2>
        <div className="rounded-2xl border border-borda bg-superficie px-5 py-4">
          <p className="text-[14px] font-medium text-texto">{usuario.nome}</p>
          <p className="mt-0.5 text-[13px] text-tenue">{usuario.email}</p>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-borda text-[15px] font-medium text-suave transition active:bg-superficie-2"
          >
            <IconeSair className="h-[18px] w-[18px]" />
            Encerrar sessão
          </button>
        </form>
      </section>
    </div>
  )
}
