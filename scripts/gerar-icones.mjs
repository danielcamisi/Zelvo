// Gera os ícones da PWA a partir de um SVG, para não versionar binário feito à mão.
// Rodar: node scripts/gerar-icones.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const FUNDO = '#0A0A0C'
const ACENTO = '#C6F24E'

// O raio do "squircle" do iOS. Para o ícone normal desenhamos o fundo inteiro,
// porque o próprio iOS recorta os cantos.
const svgIcone = (tamanho, comMargem) => {
  const p = comMargem ? tamanho * 0.22 : tamanho * 0.16
  const lado = tamanho - p * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
  <rect width="${tamanho}" height="${tamanho}" fill="${FUNDO}"/>
  <g transform="translate(${p} ${p}) scale(${lado / 24})">
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="none" stroke="${ACENTO}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
}

await mkdir('public/icons', { recursive: true })

const saidas = [
  { arquivo: 'icon-192.png', tamanho: 192, margem: false },
  { arquivo: 'icon-512.png', tamanho: 512, margem: false },
  // maskable precisa da zona de segurança: o conteúdo fica dentro de 80% do centro
  { arquivo: 'icon-maskable-512.png', tamanho: 512, margem: true },
  // ícone que o iOS usa na tela de início
  { arquivo: 'apple-touch-icon.png', tamanho: 180, margem: false },
]

for (const { arquivo, tamanho, margem } of saidas) {
  await sharp(Buffer.from(svgIcone(tamanho, margem)))
    .png()
    .toFile(`public/icons/${arquivo}`)
  console.log('gerado public/icons/' + arquivo)
}
