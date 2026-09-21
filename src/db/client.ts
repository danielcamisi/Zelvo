import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { avaliarUrlDoBanco } from './erros'
import * as schema from './schema'

/**
 * Conexão com o Postgres.
 *
 * Este módulo só pode ser importado em código de servidor. O cliente nunca
 * fala com o banco: tudo passa por Server Action ou Route Handler.
 *
 * A conexão é preguiçosa de propósito. O `next build` carrega os módulos das
 * páginas para coletar configuração, e abrir conexão nessa hora faria o build
 * inteiro falhar em qualquer ambiente sem `DATABASE_URL` — inclusive um
 * Preview onde a variável ficou de fora. Assim o erro só aparece na primeira
 * consulta de verdade, onde ele é informação útil em vez de deploy quebrado.
 */
function criarConexao() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL não está configurada. Pegue a connection string do Supabase em Project Settings → Database e adicione na Vercel (Production e Preview).',
    )
  }

  // Erro que dá para apontar antes de tentar conectar vale mais do que o
  // ENOTFOUND que viria depois.
  const problema = avaliarUrlDoBanco(url)
  if (problema) throw new Error(problema)

  // Em serverless cada invocação é um processo curto: pool pequeno e sem
  // prepared statements, que o pooler do Supabase (PgBouncer) não suporta.
  return postgres(url, {
    max: 1,
    prepare: false,
    // Solta o socket quando a invocação acaba, em vez de deixá-lo ocupando
    // vaga no pooler até o processo morrer.
    idle_timeout: 20,
  })
}

type Banco = ReturnType<typeof drizzle<typeof schema>>

declare global {
  var __bancoZelvo: Banco | undefined
}

function obterBanco(): Banco {
  // Em desenvolvimento o hot reload recria os módulos: reaproveita a conexão
  // para não estourar o limite do Postgres.
  if (globalThis.__bancoZelvo) return globalThis.__bancoZelvo

  const banco = drizzle(criarConexao(), { schema })
  if (process.env.NODE_ENV !== 'production') globalThis.__bancoZelvo = banco
  return banco
}

/** Mesma interface do Drizzle; só abre a conexão na primeira consulta. */
export const db = new Proxy({} as Banco, {
  get(_alvo, propriedade, receptor) {
    const banco = obterBanco()
    const valor = Reflect.get(banco, propriedade, receptor)
    return typeof valor === 'function' ? valor.bind(banco) : valor
  },
})

export { schema }
