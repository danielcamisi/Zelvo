/**
 * Ícones da interface.
 *
 * Desenhados em traço, herdando `currentColor`, porque a paleta é
 * monocromática: quem define a cor é o elemento que usa o ícone, nunca o
 * ícone. `aria-hidden` em todos — o rótulo acessível fica no botão ou link
 * que o envolve.
 */
type PropsIcone = { className?: string }

function Base({ className, children }: PropsIcone & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'h-5 w-5'}
    >
      {children}
    </svg>
  )
}

export function IconeHoje(props: PropsIcone) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Base>
  )
}

export function IconePerfil(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Base>
  )
}

export function IconeConfiguracoes(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.2 14.4a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-1.78-.32 1.6 1.6 0 0 0-.97 1.46V20a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1.03-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.46-.98H4a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.46-1.03 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.06.06a1.6 1.6 0 0 0 1.77.32h.07a1.6 1.6 0 0 0 .97-1.46V4a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 .98 1.46 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.06a1.6 1.6 0 0 0-.32 1.77v.07a1.6 1.6 0 0 0 1.46.97H20a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.46.98z" />
    </Base>
  )
}

export function IconeAtencao(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.2M12 16.3h.01" />
    </Base>
  )
}

export function IconeConcluido(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.3 2.6 2.6 5-5.4" />
    </Base>
  )
}

export function IconeInformacao(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.2M12 7.8h.01" />
    </Base>
  )
}

export function IconeSair(props: PropsIcone) {
  return (
    <Base {...props}>
      <path d="M15 4h2.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H15" />
      <path d="M10 8 6 12l4 4M6 12h9" />
    </Base>
  )
}

export function IconeSeta(props: PropsIcone) {
  return (
    <Base {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Base>
  )
}

export function MarcaZelvo(props: PropsIcone) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className ?? 'h-6 w-6'}
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  )
}

export function IconeMetas(props: PropsIcone) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="0.8" />
    </Base>
  )
}

export function IconeTarefas(props: PropsIcone) {
  return (
    <Base {...props}>
      <path d="M3.5 6.5 5 8l2.5-2.5M3.5 12.5 5 14l2.5-2.5M3.5 18.5 5 20l2.5-2.5" />
      <path d="M11 7h9.5M11 13h9.5M11 19h9.5" />
    </Base>
  )
}

export function IconeMais(props: PropsIcone) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  )
}
