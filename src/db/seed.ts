/**
 * Popula o catálogo de mensagens de foco.
 * Idempotente: pode rodar quantas vezes quiser.
 *
 * Rodar: npm run db:seed
 *
 * Quem não tem terminal configurado usa o caminho do SQL Editor do Supabase:
 * `npm run db:sql` gera drizzle/supabase-setup.sql com este mesmo conteúdo.
 */
import { db } from './client'
import { MENSAGENS } from './mensagens-foco'
import { mensagensFoco } from './schema'

export async function semear() {
  const existentes = await db.select({ texto: mensagensFoco.texto }).from(mensagensFoco)
  const jaTem = new Set(existentes.map((m) => m.texto))
  const faltando = MENSAGENS.filter((m) => !jaTem.has(m.texto))

  if (faltando.length === 0) {
    console.log('Nada a semear: as ' + MENSAGENS.length + ' mensagens já estão no banco.')
    return
  }

  await db.insert(mensagensFoco).values(faltando)
  console.log('Inseridas ' + faltando.length + ' mensagens de foco.')
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  semear()
    .then(() => process.exit(0))
    .catch((erro) => {
      console.error(erro)
      process.exit(1)
    })
}
