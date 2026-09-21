/**
 * Foto de perfil do header. Por ora é um avatar de iniciais: o upload de
 * imagem ainda não existe, e `usuarios.avatar_url` nasce nulo. Quando o
 * upload entrar, basta preencher `url` — o resto da interface não muda.
 */
export default function Avatar({
  nome,
  url,
  tamanho = 'medio',
}: {
  nome: string
  url?: string | null
  tamanho?: 'medio' | 'grande'
}) {
  const classes =
    tamanho === 'grande'
      ? 'h-20 w-20 text-2xl'
      : 'h-11 w-11 text-[15px]'

  if (url) {
    return (
      // Imagem vinda de armazenamento externo, com domínio ainda não definido:
      // <img> evita ter de fixar o host no next.config antes da hora.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${classes} shrink-0 rounded-full border border-borda object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${classes} flex shrink-0 items-center justify-center rounded-full border border-borda-forte bg-superficie-2 font-semibold tracking-wide text-texto`}
    >
      {iniciais(nome)}
    </span>
  )
}

/** Primeira letra do primeiro e do último nome. "Daniel Silva" vira "DS". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
