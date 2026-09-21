/**
 * Tema claro e escuro.
 *
 * A escolha vive no `localStorage`, não no banco: é preferência do aparelho,
 * e o iPhone instalado na tela de início e o navegador do computador podem
 * querer coisas diferentes. "Sistema" é o padrão e significa não gravar nada,
 * deixando o `prefers-color-scheme` mandar.
 */

export const CHAVE_TEMA = 'zelvo-tema'

export type Tema = 'sistema' | 'claro' | 'escuro'

export const TEMAS: { valor: Tema; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Sistema' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
]

/**
 * Roda antes da primeira pintura, no `<head>`.
 *
 * Precisa ser assim, inline e síncrono: se a escolha só fosse aplicada
 * depois que o React monta, quem escolheu claro veria a tela piscar preta a
 * cada abertura. O `try` existe porque `localStorage` lança em aba privada.
 */
export const SCRIPT_DO_TEMA = `(function(){try{var t=localStorage.getItem('${CHAVE_TEMA}');if(t==='claro'||t==='escuro'){document.documentElement.setAttribute('data-tema',t)}}catch(e){}})()`

export function temaSalvo(): Tema {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA)
    return valor === 'claro' || valor === 'escuro' ? valor : 'sistema'
  } catch {
    return 'sistema'
  }
}

export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement
  if (tema === 'sistema') raiz.removeAttribute('data-tema')
  else raiz.setAttribute('data-tema', tema)

  try {
    if (tema === 'sistema') localStorage.removeItem(CHAVE_TEMA)
    else localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // Aba privada: o tema vale para esta visita e pronto.
  }
}
