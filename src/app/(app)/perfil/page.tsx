import type { Metadata } from 'next'
import FotoDePerfil from '@/components/FotoDePerfil'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { nivelPorXp } from '@/regras/nivel'

export const metadata: Metadata = { title: 'Perfil · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  const progresso = nivelPorXp(usuario.xpTotal)

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col items-center gap-3 text-center">
        <FotoDePerfil usuarioId={usuario.id} nome={usuario.nome} url={usuario.avatarUrl} />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{usuario.nome}</h1>
          <p className="text-[13px] text-tenue">@{usuario.username}</p>
        </div>
      </header>

      <section className="rounded-3xl border border-borda bg-superficie p-5">
        <h2 className="text-xs font-semibold tracking-[0.12em] text-tenue uppercase">
          Progresso
        </h2>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">Nível {progresso.nivel}</span>
          <span className="text-[13px] text-suave">{progresso.rank}</span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-superficie-3"
          role="progressbar"
          aria-valuenow={progresso.progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso para o próximo nível"
        >
          <div className="h-full rounded-full bg-acento" style={{ width: `${progresso.progresso}%` }} />
        </div>
        <p className="mt-3 text-[13px] text-suave">
          {progresso.xpNoNivel} de {progresso.xpParaProximo} XP para o nível{' '}
          {progresso.nivel + 1}.
        </p>
      </section>

      <section className="rounded-3xl border border-borda bg-superficie">
        <h2 className="px-5 pt-5 text-xs font-semibold tracking-[0.12em] text-tenue uppercase">
          Dados da conta
        </h2>
        <dl className="mt-2 flex flex-col px-5 pb-1">
          <Linha rotulo="Nome" valor={usuario.nome} />
          <Linha rotulo="Username" valor={`@${usuario.username}`} />
          <Linha rotulo="E-mail" valor={usuario.email} />
          <Linha rotulo="Fuso horário" valor={usuario.timezone} />
          <Linha
            rotulo="Sequência atual"
            valor={`${usuario.streakAtual} ${usuario.streakAtual === 1 ? 'dia' : 'dias'}`}
          />
        </dl>
      </section>

      <p className="text-[13px] leading-relaxed text-tenue">
        A edição dos dados entra em uma etapa seguinte. Os ajustes do app, incluindo o tema claro
        ou escuro, ficam em Configurações, no ícone de engrenagem do topo.
      </p>
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borda/70 py-3.5 last:border-b-0">
      <dt className="text-[13px] text-suave">{rotulo}</dt>
      <dd className="truncate text-[14px] font-medium text-texto">{valor}</dd>
    </div>
  )
}
