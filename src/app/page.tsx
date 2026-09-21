import PainelPush from '@/components/PainelPush'

export default function Pagina() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-7 px-6 pt-14 pb-10">
      <header className="flex flex-col gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-acento text-fundo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
          </svg>
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--fonte-display), sans-serif' }}
        >
          ZELVO
        </h1>
        <p className="text-sm leading-relaxed text-suave">
          Marco 1: confirmar que o app instala na tela de início e que a notificação chega no
          seu iPhone. Ainda não há metas nem tarefas — isso vem depois que este passo fechar.
        </p>
      </header>

      <PainelPush />
    </main>
  )
}
