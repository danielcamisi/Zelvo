/**
 * Monta o SQL completo de configuração do banco, para colar no SQL Editor do
 * Supabase. Usado pelo script `npm run db:sql` e pelo teste que garante que o
 * arquivo versionado está em dia.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { MENSAGENS } from './mensagens-foco'

type EntradaJournal = { idx: number; when: number; tag: string }


/**
 * Deixa o SQL das migrations seguro para rodar mais de uma vez.
 *
 * O SQL Editor não impede ninguém de colar duas vezes, e um erro vermelho no
 * meio da configuração assusta sem motivo. As migrations do Drizzle usam
 * CREATE TYPE, CREATE TABLE, ADD CONSTRAINT e CREATE INDEX crus; aqui cada um
 * ganha uma guarda. O arquivo versionado das migrations não é tocado — só esta
 * cópia, que existe para ser colada.
 */
function tornarIdempotente(sql: string): string {
  return (
    sql
      // CREATE TYPE não tem IF NOT EXISTS: engole o erro de já existir.
      .replace(
        /^CREATE TYPE ([\s\S]*?);$/gm,
        (_todo, corpo) =>
          `DO $$ BEGIN\n  CREATE TYPE ${corpo};\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`,
      )
      // ADD CONSTRAINT também não tem, e repetir daria erro de chave duplicada.
      .replace(
        /^ALTER TABLE ([\s\S]*?);$/gm,
        (_todo, corpo) =>
          `DO $$ BEGIN\n  ALTER TABLE ${corpo};\nEXCEPTION WHEN duplicate_object THEN NULL;\nEND $$;`,
      )
      .replace(/^CREATE TABLE (?!IF NOT EXISTS)/gm, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/^CREATE INDEX (?!IF NOT EXISTS)/gm, 'CREATE INDEX IF NOT EXISTS ')
      .replace(/^CREATE UNIQUE INDEX (?!IF NOT EXISTS)/gm, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
  )
}

export const CAMINHO_SQL = join('drizzle', 'supabase-setup.sql')

export function gerarSqlSupabase(raiz = process.cwd()): string {
  const pasta = join(raiz, 'drizzle')
  const journal = JSON.parse(readFileSync(join(pasta, 'meta/_journal.json'), 'utf8')) as {
    entries: EntradaJournal[]
  }

  const partes: string[] = [
    `-- ============================================================
-- ZELVO — configuração do banco
-- Gerado por \`npm run db:sql\`. Não edite à mão.
--
-- Cole isto inteiro no SQL Editor do Supabase e rode uma vez.
-- É seguro rodar de novo: nada é duplicado.
-- ============================================================
`,
  ]

  for (const entrada of journal.entries) {
    const sql = readFileSync(join(pasta, entrada.tag + '.sql'), 'utf8')
    partes.push(`
-- ------------------------------------------------------------
-- migration: ${entrada.tag}
-- ------------------------------------------------------------
`)
    partes.push(tornarIdempotente(sql.split('--> statement-breakpoint').join('\n')))
  }

  const valores = MENSAGENS.map(
    (m) => `  ('${m.tom}', '${m.evento}', '${String(m.texto).replace(/'/g, "''")}')`,
  ).join(',\n')

  partes.push(`
-- ------------------------------------------------------------
-- mensagens de foco (catálogo)
-- ------------------------------------------------------------

INSERT INTO mensagens_foco (tom, evento, texto)
SELECT novas.tom::tom_foco, novas.evento::evento_foco, novas.texto
FROM (VALUES
${valores}
) AS novas(tom, evento, texto)
WHERE NOT EXISTS (SELECT 1 FROM mensagens_foco m WHERE m.texto = novas.texto);
`)

  partes.push(`
-- ------------------------------------------------------------
-- controle de migrations do Drizzle
-- ------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
`)

  for (const entrada of journal.entries) {
    const conteudo = readFileSync(join(pasta, entrada.tag + '.sql'), 'utf8')
    const hash = createHash('sha256').update(conteudo).digest('hex')
    partes.push(`INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '${hash}', ${entrada.when}
WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '${hash}');
`)
  }

  return partes.join('\n')
}
