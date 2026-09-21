import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Conexão com o Postgres.
 *
 * Este módulo só pode ser importado em código de servidor. O cliente nunca
 * fala com o banco: tudo passa por Server Action ou Route Handler.
 */
function criarConexao() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL não está configurada. Pegue a connection string do Supabase em Project Settings → Database.',
    )
  }

  // Em serverless cada invocação é um processo curto: pool pequeno e sem
  // prepared statements, que o pooler do Supabase (PgBouncer) não suporta.
  return postgres(url, { max: 1, prepare: false })
}

declare global {
  // eslint-disable-next-line no-var
  var __conexaoZelvo: ReturnType<typeof criarConexao> | undefined
}

// Em desenvolvimento o hot reload recria os módulos: reaproveita a conexão
// para não estourar o limite do Postgres.
const conexao = globalThis.__conexaoZelvo ?? criarConexao()
if (process.env.NODE_ENV !== 'production') globalThis.__conexaoZelvo = conexao

export const db = drizzle(conexao, { schema })
export { schema }
