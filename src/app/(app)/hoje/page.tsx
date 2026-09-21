import type { Metadata } from 'next'
import Link from 'next/link'
import ItemTarefa from '@/components/ItemTarefa'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { conclusoesDoDia } from '@/modulos/conclusoes/consultas'
import { type TarefaComMeta, tarefasDeHoje } from '@/modulos/tarefas/consultas'
import { nivelPorXp } from '@/regras/nivel'

export const metadata: Metadata = { title: 'Hoje · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  // `nivelPorXp` converte o XP total no XP dentro do nível atual. A barra
  // precisa desse recorte: usar o total direto faria 100% a partir do
  // primeiro nível concluído.
  const progresso = nivelPorXp(usuario.xpTotal)
  const { hoje, tarefas } = await tarefasDeHoje(usuario.id, usuario.timezone)
  const concluidas = await conclusoesDoDia(usuario.id, hoje)
  const grupos = agruparPorMeta(tarefas)
  const feitas = tarefas.filter((tarefa) => concluidas.has(tarefa.id)).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hoje</h1>
        <p className="text-[13px] text-suave">{dataPorExtenso(usuario.timezone)}</p>
      </header>

      <section className="rounded-3xl border border-borda bg-superficie p-5">
        <div className="flex items-baseline justify-between gap-3">
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
          <div
            className="h-full rounded-full bg-acento transition-[width] duration-500"
            style={{ width: `${progresso.progresso}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Indicador rotulo="XP no nível" valor={`${progresso.xpNoNivel}/${progresso.xpParaProximo}`} />
          <Indicador
            rotulo="Sequência"
            valor={`${usuario.streakAtual} ${usuario.streakAtual === 1 ? 'dia' : 'dias'}`}
          />
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-tight">Tarefas de hoje</h2>
          {tarefas.length > 0 ? (
            <span className="text-[13px] text-tenue tabular-nums">
              {feitas} de {tarefas.length}
            </span>
          ) : null}
        </div>

        {tarefas.length === 0 ? (
          <Vazio />
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.chave} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 px-1">
                {grupo.metaId ? (
                  <Link
                    href={`/metas/${grupo.metaId}`}
                    className="truncate text-xs font-semibold tracking-[0.12em] text-tenue uppercase transition active:text-suave"
                  >
                    {grupo.titulo}
                  </Link>
                ) : (
                  <span className="truncate text-xs font-semibold tracking-[0.12em] text-tenue uppercase">
                    {grupo.titulo}
                  </span>
                )}
                <span className="shrink-0 text-[12px] text-tenue tabular-nums">
                  {grupo.tarefas.filter((tarefa) => concluidas.has(tarefa.id)).length}/
                  {grupo.tarefas.length}
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {grupo.tarefas.map((tarefa) => (
                  <ItemTarefa
                    key={tarefa.id}
                    tarefa={tarefa}
                    concluivel
                    concluida={concluidas.has(tarefa.id)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

type Grupo = {
  chave: string
  metaId: string | null
  titulo: string
  tarefas: TarefaComMeta[]
}

/**
 * As tarefas do dia, separadas pela meta a que pertencem.
 *
 * A ordem dos grupos segue o primeiro horário de cada um, porque o dia se lê
 * de cima para baixo. As tarefas soltas ficam por último: elas não puxam
 * nenhum objetivo e não devem abrir a tela.
 */
function agruparPorMeta(tarefas: TarefaComMeta[]): Grupo[] {
  const grupos = new Map<string, Grupo>()

  for (const tarefa of tarefas) {
    const chave = tarefa.metaId ?? ''
    const grupo = grupos.get(chave)
    if (grupo) {
      grupo.tarefas.push(tarefa)
      continue
    }
    grupos.set(chave, {
      chave: chave || 'sem-meta',
      metaId: tarefa.metaId,
      titulo: tarefa.metaTitulo ?? 'Sem meta',
      tarefas: [tarefa],
    })
  }

  return [...grupos.values()].sort((a, b) => {
    if (!a.metaId) return 1
    if (!b.metaId) return -1
    // `tarefasDeHoje` já vem ordenada por horário, então o primeiro item de
    // cada grupo é o mais cedo dele. Tarefa sem horário vai para o fim.
    const horaA = a.tarefas[0].horario ?? '99:99'
    const horaB = b.tarefas[0].horario ?? '99:99'
    return horaA === horaB ? a.titulo.localeCompare(b.titulo, 'pt-BR') : horaA < horaB ? -1 : 1
  })
}

function Vazio() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-5">
      <p className="text-[13px] leading-relaxed text-suave">
        Nada marcado para hoje. Crie uma meta e pendure nela as tarefas que vão aparecer aqui
        todo dia.
      </p>
      <div className="flex gap-2">
        <Link
          href="/metas/nova"
          className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-acento text-[14px] font-semibold text-fundo transition active:scale-[0.99]"
        >
          Nova meta
        </Link>
        <Link
          href="/tarefas/nova"
          className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-borda text-[14px] font-medium text-texto transition active:bg-superficie-2"
        >
          Nova tarefa
        </Link>
      </div>
    </div>
  )
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-superficie-2 px-4 py-3">
      <dt className="text-[11px] tracking-[0.08em] text-tenue uppercase">{rotulo}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-texto">{valor}</dd>
    </div>
  )
}

/**
 * "Domingo, 21 de setembro" no fuso do usuário, com inicial maiúscula.
 *
 * O `timezone` vem do banco e nada valida o conteúdo na escrita; um valor
 * inválido faz o `Intl` lançar. A data no topo da tela não vale derrubar a
 * página, então cai para o fuso do servidor.
 */
function dataPorExtenso(timezone: string): string {
  const opcoes: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }

  let texto: string
  try {
    texto = new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: timezone }).format(new Date())
  } catch {
    texto = new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date())
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
