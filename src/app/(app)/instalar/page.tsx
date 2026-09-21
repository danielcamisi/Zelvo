import type { Metadata } from 'next'
import PainelPush from '@/components/PainelPush'

export const metadata: Metadata = { title: 'Instalar · Zelvo' }

export default function Pagina() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Instalação e lembretes</h1>
        <p className="text-sm leading-relaxed text-suave">
          Confere se o app está instalado na tela de início e se a notificação chega no
          aparelho. Os lembretes de verdade entram no passo 9.
        </p>
      </header>
      <PainelPush />
    </div>
  )
}
