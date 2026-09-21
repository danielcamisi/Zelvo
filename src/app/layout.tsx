import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
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
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body
        className="bg-fundo text-texto antialiased"
        style={{ fontFamily: 'var(--fonte-corpo), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
