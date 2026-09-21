/**
 * Foto de perfil. Sem imagem, cai nas iniciais — `usuarios.avatar_url` nasce
 * nulo e continua assim para quem nunca enviou nada. O envio em si mora em
 * `FotoDePerfil`; aqui é só a exibição, usada também no cabeçalho.
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
      // <img> e não `next/image` de propósito: a foto vem do Storage do
      // Supabase já cortada em 512x512, então não há o que otimizar, e usar
      // `next/image` exigiria fixar o host do projeto no next.config.
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
