/**
 * Como cada valor do banco aparece na tela.
 *
 * Os enums do Postgres são em minúsculas e sem acento, porque identificador
 * de banco não deve carregar acento. O que o usuário lê vive aqui, num lugar
 * só, para não haver "financas" numa tela e "Finanças" em outra.
 */

export const CATEGORIAS = {
  saude: 'Saúde',
  fitness: 'Fitness',
  financas: 'Finanças',
  estudos: 'Estudos',
  carreira: 'Carreira',
  produtividade: 'Produtividade',
  pessoal: 'Pessoal',
} as const

export const PRIORIDADES = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
} as const

export const DIFICULDADES = {
  facil: 'Fácil',
  media: 'Média',
  dificil: 'Difícil',
} as const

export const RECORRENCIAS = {
  unica: 'Uma vez só',
  diaria: 'Todo dia',
  semanal: 'Dias da semana',
  mensal: 'Dias do mês',
  anual: 'Uma vez por ano',
} as const

export const STATUS_META = {
  ativa: 'Ativa',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
} as const

export const VISIBILIDADES = {
  privada: 'Só eu',
  publica: 'Pública',
} as const

/** 1 = segunda … 7 = domingo, a mesma numeração de `regras/datas`. */
export const DIAS_DA_SEMANA = [
  { valor: 1, curto: 'Seg', longo: 'segunda-feira' },
  { valor: 2, curto: 'Ter', longo: 'terça-feira' },
  { valor: 3, curto: 'Qua', longo: 'quarta-feira' },
  { valor: 4, curto: 'Qui', longo: 'quinta-feira' },
  { valor: 5, curto: 'Sex', longo: 'sexta-feira' },
  { valor: 6, curto: 'Sáb', longo: 'sábado' },
  { valor: 7, curto: 'Dom', longo: 'domingo' },
] as const

export function opcoes<T extends Record<string, string>>(mapa: T) {
  return Object.entries(mapa) as [keyof T & string, string][]
}

/** 'AAAA-MM-DD' → '21/09/2026'. Sem `Date`, para não escorregar de fuso. */
export function dataCurta(data: string | null | undefined): string {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  if (!ano || !mes || !dia) return ''
  return `${dia}/${mes}/${ano}`
}

/** '08:30:00' → '08:30'. O banco guarda `time`, que vem com segundos. */
export function horaCurta(hora: string | null | undefined): string {
  if (!hora) return ''
  return hora.slice(0, 5)
}

export function dinheiro(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return ''
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return ''
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * '15000.00' (como o `numeric` devolve) → '15000,00' (como se digita aqui).
 *
 * Importa: o campo de dinheiro entende o ponto como separador de milhar, então
 * devolver o valor do banco cru transformaria 15000.00 em 1500000 ao salvar.
 */
export function dinheiroParaCampo(valor: string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return ''
  return valor.replace('.', ',')
}
