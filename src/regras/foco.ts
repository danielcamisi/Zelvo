/**
 * Qual mensagem de foco mostrar.
 *
 * Função pura: recebe o catálogo que veio do banco e escolhe. A escolha é
 * determinística dentro do mesmo dia e contexto, então a mensagem não fica
 * trocando a cada render — mas muda de um dia para o outro.
 */

export type TomFoco = 'level' | 'sincero' | 'agressivo'
export type EventoFoco = 'pendente' | 'conclusao' | 'resumo' | 'cobranca'

export type MensagemFoco = {
  tom: TomFoco
  evento: EventoFoco
  texto: string
}

/** Hash estável e barato, só para escolher sempre a mesma frase na mesma semente. */
function embaralhar(semente: string): number {
  let h = 2166136261
  for (let i = 0; i < semente.length; i += 1) {
    h ^= semente.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function escolherMensagem(
  catalogo: MensagemFoco[],
  tom: TomFoco,
  evento: EventoFoco,
  semente = '',
): string | null {
  const candidatas = catalogo.filter((m) => m.tom === tom && m.evento === evento)
  if (candidatas.length === 0) return null
  const ordenadas = [...candidatas].sort((a, b) => a.texto.localeCompare(b.texto))
  return ordenadas[embaralhar(semente) % ordenadas.length].texto
}
