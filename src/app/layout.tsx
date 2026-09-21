import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { SCRIPT_DO_TEMA } from '@/modulos/comum/tema'
import './globals.css'

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--fonte-display',
})

const corpo = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-corpo',
})

export const metadata: Metadata = {
  title: 'Zelvo',
  description: 'Organize sua vida. Alcance suas metas. Evolua.',
  applicationName: 'Zelvo',
  authors: [{ name: 'Zivvu' }],
  creator: 'Zivvu',
  publisher: 'Zivvu',
  appleWebApp: {
    capable: true,
    title: 'Zelvo',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  // Duas cores porque o app tem dois temas: a barra do navegador acompanha o
  // que o sistema pede. Instalado no iPhone a barra é translúcida e quem
  // manda é o fundo da página, então isto vale sobretudo no navegador.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <head>
        {/* Aplica o tema escolhido antes da primeira pintura, para a tela não
            piscar na cor errada a cada abertura. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body
        className="bg-fundo text-texto antialiased"
        style={{ fontFamily: 'var(--fonte-corpo), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
