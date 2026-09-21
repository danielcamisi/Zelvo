import { IconeAtencao, IconeConcluido, IconeInformacao } from './Icones'

/**
 * Caixa de mensagem do app (erro, confirmação, informação).
 *
 * Sem cor para diferenciar os tipos — a paleta é monocromática. A distinção
 * vem do ícone, do título e do peso da borda: erro tem borda forte, os
 * outros têm borda discreta.
 */
export type TipoAviso = 'erro' | 'sucesso' | 'informacao'

const CONFIG = {
  erro: { Icone: IconeAtencao, titulo: 'Não foi possível concluir', borda: 'border-borda-forte' },
  sucesso: { Icone: IconeConcluido, titulo: 'Tudo certo', borda: 'border-borda' },
  informacao: { Icone: IconeInformacao, titulo: 'Atenção', borda: 'border-borda' },
} as const

export default function Aviso({
  tipo,
  titulo,
  children,
}: {
  tipo: TipoAviso
  titulo?: string
  children: React.ReactNode
}) {
  const { Icone, titulo: padrao, borda } = CONFIG[tipo]

  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-2xl border ${borda} bg-superficie-2 px-4 py-3.5`}
    >
      <Icone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-suave" />
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold text-texto">{titulo ?? padrao}</p>
        <p className="text-[13px] leading-relaxed text-suave">{children}</p>
      </div>
    </div>
  )
}
