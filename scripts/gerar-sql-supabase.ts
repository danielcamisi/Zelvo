/** Escreve drizzle/supabase-setup.sql. Rodar: npm run db:sql */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CAMINHO_SQL, gerarSqlSupabase } from '../src/db/gerar-sql'

const destino = join(process.cwd(), CAMINHO_SQL)
writeFileSync(destino, gerarSqlSupabase())
console.log('gerado ' + destino)
