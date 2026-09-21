import type { MetadataRoute } from 'next'

// O manifest é o que torna o app instalável. `display: standalone` é
// obrigatório para o iOS liberar a Push API na tela de início.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zelvo',
    short_name: 'Zelvo',
    description: 'Organize sua vida. Alcance suas metas. Evolua.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
