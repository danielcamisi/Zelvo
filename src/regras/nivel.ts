/**
 * Nível e rank.
 *
 * A curva: cada nível custa 200 × (nível + 1) de XP. O nível 7 pede 1600 para
 * virar 8. Subir cedo é rápido, subir tarde custa — sem virar grind.
 */

export const XP_POR_NIVEL_BASE = 200

export type FaixaRank = { ate: number; nome: string }

/** Fonte da verdade dos ranks. `ate` é o último nível da faixa, inclusive. */
export const RANKS: FaixaRank[] = [
  { ate: 2, nome: 'Iniciante' },
  { ate: 4, nome: 'Aprendiz' },
  { ate: 6, nome: 'Consistente' },
  { ate: 8, nome: 'Construtor' },
  { ate: 11, nome: 'Persistente' },
  { ate: 15, nome: 'Disciplinado' },
  { ate: 20, nome: 'Inabalável' },
  { ate: Number.POSITIVE_INFINITY, nome: 'Lenda' },
]

/** Quanto falta juntar, dentro do nível, para chegar no seguinte. */
export function xpParaProximoNivel(nivel: number): number {
  return XP_POR_NIVEL_BASE * (nivel + 1)
}

/** XP total acumulado necessário para ESTAR no nível informado. */
export function xpAcumuladoAteNivel(nivel: number): number {
  if (nivel <= 1) return 0
  // Soma de 200 × (k+1) para k = 1..nivel-1.
  return XP_POR_NIVEL_BASE * ((nivel * (nivel + 1)) / 2 - 1)
}

export function rankDoNivel(nivel: number): string {
  return RANKS.find((faixa) => nivel <= faixa.ate)?.nome ?? RANKS[RANKS.length - 1].nome
}

export type EstadoNivel = {
  nivel: number
  rank: string
  xpNoNivel: number
  xpParaProximo: number
  /** 0..100, para a barra de progresso. */
  progresso: number
}

/** Converte XP total no estado completo de nível. */
export function nivelPorXp(xpTotal: number): EstadoNivel {
  const xp = Math.max(0, Math.floor(xpTotal))

  // Inverte xpAcumuladoAteNivel: n² + n - 2(xp/200 + 1) = 0.
  const estimado = Math.floor((-1 + Math.sqrt(1 + 8 * (xp / XP_POR_NIVEL_BASE + 1))) / 2)
  let nivel = Math.max(1, estimado)

  // A raiz pode errar por um por causa de ponto flutuante: corrige nos dois sentidos.
  while (xpAcumuladoAteNivel(nivel + 1) <= xp) nivel += 1
  while (nivel > 1 && xpAcumuladoAteNivel(nivel) > xp) nivel -= 1

  const xpNoNivel = xp - xpAcumuladoAteNivel(nivel)
  const xpParaProximo = xpParaProximoNivel(nivel)

  return {
    nivel,
    rank: rankDoNivel(nivel),
    xpNoNivel,
    xpParaProximo,
    progresso: Math.min(100, Math.round((xpNoNivel / xpParaProximo) * 100)),
  }
}
