/**
 * O arquivo que o Daniel cola no SQL Editor do Supabase precisa funcionar de
 * primeira e ser seguro de rodar de novo. Este teste aplica ele inteiro num
 * Postgres limpo, duas vezes, e confere o resultado.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'

import { PGlite } from '@electric-sql/pglite'

import { CAMINHO_SQL, gerarSqlSupabase } from '../gerar-sql'
import { MENSAGENS } from '../mensagens-foco'

let bd: PGlite
let sqlCompleto: string

before(async () => {
  sqlCompleto = gerarSqlSupabase()
  bd = new PGlite()
})

after(async () => {
  await bd?.close()
})

describe('supabase-setup.sql', () => {
  it('o arquivo versionado está em dia com o schema', () => {
    // Se este teste quebrar, rode `npm run db:sql` e commite o resultado.
    const noDisco = readFileSync(join(process.cwd(), CAMINHO_SQL), 'utf8')
    assert.equal(noDisco, sqlCompleto, 'drizzle/supabase-setup.sql está desatualizado')
  })

  it('aplica inteiro num banco limpo, de uma vez só', async () => {
    await bd.exec(sqlCompleto)

    const { rows } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    )
    assert.equal(rows[0].total, 10, 'deveriam existir as 10 tabelas do MVP')
  })

  it('semeia o catálogo de mensagens de foco', async () => {
    const { rows } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM mensagens_foco`,
    )
    assert.equal(rows[0].total, MENSAGENS.length)

    // Os três tons precisam estar todos representados.
    const { rows: tons } = await bd.query<{ tom: string }>(
      `SELECT DISTINCT tom::text AS tom FROM mensagens_foco ORDER BY tom`,
    )
    assert.deepEqual(tons.map((t) => t.tom).sort(), ['agressivo', 'level', 'sincero'])
  })

  it('registra as migrations para o db:migrate não repetir nada', async () => {
    const { rows } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM drizzle.__drizzle_migrations`,
    )
    assert.equal(rows[0].total, 2, '0000_inicial e 0001_rls')
  })

  it('rodar de novo não duplica nem quebra', async () => {
    // O SQL Editor não impede ninguém de colar duas vezes. Não pode dar ruim.
    await bd.exec(sqlCompleto)

    const { rows: msgs } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM mensagens_foco`,
    )
    assert.equal(msgs[0].total, MENSAGENS.length, 'mensagens não podem duplicar')

    const { rows: migs } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM drizzle.__drizzle_migrations`,
    )
    assert.equal(migs[0].total, 2, 'registro de migration não pode duplicar')
  })

  it('o bloco de RLS não roda fora do Supabase', async () => {
    // Sem schema auth, o DO block sai sem fazer nada — senão os testes
    // ficariam bloqueados por RLS sem política nenhuma.
    const { rows } = await bd.query<{ relrowsecurity: boolean }>(
      `SELECT relrowsecurity FROM pg_class WHERE relname = 'metas'`,
    )
    assert.equal(rows[0].relrowsecurity, false)
  })
})
