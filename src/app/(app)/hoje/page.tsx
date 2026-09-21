import type { Metadata } from 'next'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { xpParaProximoNivel } from '@/regras/nivel'

export const metadata: Metadata = { title: 'Hoje · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  const alvo = xpParaProximoNivel(usuario.nivel)

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-borda bg-superficie p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-suave">Nível {usuario.nivel}</span>
          <span className="text-[13px] text-suave">{usuario.rank}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-superficie-2">
          <div
            className="h-full rounded-full bg-acento"
            style={{ width: `${Math.min(100, Math.round((usuario.xpTotal / alvo) * 100))}%` }}
          />
        </div>
        <p className="mt-3 text-[13px] text-suave">
          {usuario.xpTotal} de {alvo} XP · streak de {usuario.streakAtual}{' '}
          {usuario.streakAtual === 1 ? 'dia' : 'dias'}
        </p>
      </section>

      <section className="rounded-3xl border border-borda bg-superficie p-5">
        <h2 className="text-base font-semibold">Suas tarefas de hoje</h2>
        <p className="mt-2 text-sm leading-relaxed text-suave">
          Ainda não há metas nem tarefas: o próximo passo do desenvolvimento é justamente
          criá-las. A conta, a sessão e o perfil (@{usuario.username}) já estão de pé.
        </p>
      </section>
    </div>
  )
}
