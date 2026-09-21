/**
 * Datas, sem armadilha de fuso.
 *
 * A regra que evita a classe inteira de bugs: a lógica de calendário trabalha
 * com string 'AAAA-MM-DD', que não tem fuso nenhum. Fuso só aparece num lugar,
 * na hora de perguntar "que dia é hoje para ESTE usuário". O servidor roda em
 * UTC e o Daniel vive em America/Sao_Paulo — sem essa separação, a tarefa das
 * 22:30 cai no dia errado.
 */

export type DataISO = string // 'AAAA-MM-DD'

/** Que dia é, neste instante, no fuso do usuário. */
export function dataNoFuso(instante: Date, timezone: string): DataISO {
  // 'en-CA' formata como AAAA-MM-DD, que é exatamente o que queremos.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante)
}

/** Que horas são, neste instante, no fuso do usuário. Formato 'HH:MM'. */
export function horaNoFuso(instante: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instante)
}

/** Meio-dia UTC: longe de qualquer virada de dia por horário de verão. */
function comoData(data: DataISO): Date {
  return new Date(data + 'T12:00:00Z')
}

/** 1 = segunda … 7 = domingo. */
export function diaDaSemana(data: DataISO): number {
  const dom0 = comoData(data).getUTCDay()
  return dom0 === 0 ? 7 : dom0
}

export function diaDoMes(data: DataISO): number {
  return comoData(data).getUTCDate()
}

export function mesDoAno(data: DataISO): number {
  return comoData(data).getUTCMonth() + 1
}

export function diasNoMes(data: DataISO): number {
  const d = comoData(data)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
}

export function somarDias(data: DataISO, dias: number): DataISO {
  const d = comoData(data)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Negativo se a for antes de b. */
export function diferencaEmDias(a: DataISO, b: DataISO): number {
  const ms = comoData(a).getTime() - comoData(b).getTime()
  return Math.round(ms / 86_400_000)
}

export function ehDataISO(valor: unknown): valor is DataISO {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
}

/** Lista inclusiva de dias entre duas datas. Protegida contra intervalo absurdo. */
export function intervaloDeDias(de: DataISO, ate: DataISO, limite = 3660): DataISO[] {
  const total = diferencaEmDias(ate, de)
  if (total < 0) return []
  const dias: DataISO[] = []
  for (let i = 0; i <= Math.min(total, limite); i += 1) dias.push(somarDias(de, i))
  return dias
}
