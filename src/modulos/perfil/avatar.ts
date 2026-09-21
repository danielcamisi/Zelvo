/**
 * O caminho e a URL da foto de perfil.
 *
 * Mora aqui, fora do `'use server'`, porque o navegador (que envia o arquivo)
 * e o servidor (que valida antes de gravar) precisam concordar sobre o mesmo
 * formato. Duas cópias dessa regra seria a forma mais fácil de abrir um furo.
 */

export const BUCKET_AVATARES = 'avatares'

/** A pasta é o id do usuário: é assim que a política do Storage sabe o dono. */
export function caminhoDoAvatar(usuarioId: string): string {
  return `${usuarioId}/avatar.jpg`
}

export function prefixoPublico(urlDoSupabase: string, usuarioId: string): string {
  return `${urlDoSupabase.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET_AVATARES}/${usuarioId}/`
}

/**
 * A URL é aceita só se apontar para a pasta do próprio usuário dentro do
 * bucket. Sem isso, a ação de salvar viraria "grave qualquer endereço no meu
 * perfil", que é um pequeno redirecionador aberto com foto.
 */
export function urlDeAvatarValida(
  url: string,
  urlDoSupabase: string,
  usuarioId: string,
): boolean {
  if (url.length > 500) return false
  return url.startsWith(prefixoPublico(urlDoSupabase, usuarioId))
}
