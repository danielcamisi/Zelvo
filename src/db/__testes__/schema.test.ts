/**
 * Aplica as migrations num Postgres real (PGlite, em memória) e exercita as
 * garantias que o schema promete. Não precisa de Supabase nem de servidor:
 * roda em qualquer máquina com `npm test`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'

import { PGlite } from '@electric-sql/pglite'

let bd: PGlite

const PASTA_MIGRATIONS = join(process.cwd(), 'drizzle')

before(async () => {
  bd = new PGlite()
  const arquivos = readdirSync(PASTA_MIGRATIONS)
    .filter((n) => n.endsWith('.sql'))
    .sort()

  for (const arquivo of arquivos) {
    const sql = readFileSync(join(PASTA_MIGRATIONS, arquivo), 'utf8')
    // O drizzle-kit separa os comandos com este marcador.
    for (const comando of sql.split('--> statement-breakpoint')) {
      if (comando.trim()) await bd.exec(comando)
    }
  }
})

after(async () => {
  await bd?.close()
})

async function criarUsuario(id: string) {
  await bd.query(
    `INSERT INTO usuarios (id, email, nome, username) VALUES ($1, $2, $3, $4)`,
    [id, `${id}@zelvo.app`, 'Daniel', id],
  )
}

const UID = '11111111-1111-1111-1111-111111111111'

describe('schema', () => {
  it('as migrations aplicam sem erro e criam as 10 tabelas', async () => {
    const { rows } = await bd.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
    )
    const nomes = rows.map((r) => r.table_name)
    for (const esperada of [
      'adiamentos_tarefa',
      'conclusoes_tarefa',
      'config_usuario',
      'envios_lembrete',
      'inscricoes_push',
      'mensagens_foco',
      'metas',
      'progresso_usuario',
      'tarefas',
      'usuarios',
    ]) {
      assert.ok(nomes.includes(esperada), `faltou a tabela ${esperada}`)
    }
  })

  it('uma tarefa não pode ser concluída duas vezes no mesmo dia', async () => {
    await criarUsuario(UID)
    const { rows: metas } = await bd.query<{ id: string }>(
      `INSERT INTO metas (usuario_id, titulo, categoria, data_inicio, xp_recompensa)
       VALUES ($1, 'Melhorar minha saúde', 'saude', '2026-09-01', 310) RETURNING id`,
      [UID],
    )
    const { rows: tarefas } = await bd.query<{ id: string }>(
      `INSERT INTO tarefas (meta_id, usuario_id, titulo, recorrencia, inicio_em, xp)
       VALUES ($1, $2, 'Tomar creatina', 'diaria', '2026-09-01', 15) RETURNING id`,
      [metas[0].id, UID],
    )
    const tarefaId = tarefas[0].id

    const concluir = () =>
      bd.query(
        `INSERT INTO conclusoes_tarefa (tarefa_id, usuario_id, data_referencia, xp_ganho)
         VALUES ($1, $2, '2026-09-21', 15)`,
        [tarefaId, UID],
      )

    await concluir()
    await assert.rejects(concluir, /duplicate key|unique/i, 'a segunda conclusão do dia deveria falhar')

    // No dia seguinte pode de novo: é isso que faz a recorrência funcionar.
    await bd.query(
      `INSERT INTO conclusoes_tarefa (tarefa_id, usuario_id, data_referencia, xp_ganho)
       VALUES ($1, $2, '2026-09-22', 15)`,
      [tarefaId, UID],
    )
    const { rows } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM conclusoes_tarefa WHERE tarefa_id = $1`,
      [tarefaId],
    )
    assert.equal(rows[0].total, 2)
  })

  it('meta nasce privada, ativa e sem valor financeiro', async () => {
    const { rows } = await bd.query<{
      visibilidade: string
      status: string
      valor_alvo: string | null
    }>(
      `INSERT INTO metas (usuario_id, titulo, categoria, data_inicio, xp_recompensa)
       VALUES ($1, 'Ler 12 livros', 'estudos', '2026-01-01', 240)
       RETURNING visibilidade, status, valor_alvo`,
      [UID],
    )
    assert.equal(rows[0].visibilidade, 'privada')
    assert.equal(rows[0].status, 'ativa')
    assert.equal(rows[0].valor_alvo, null)
  })

  it('apagar o usuário leva junto metas, tarefas e conclusões', async () => {
    const outro = '22222222-2222-2222-2222-222222222222'
    await criarUsuario(outro)
    const { rows: m } = await bd.query<{ id: string }>(
      `INSERT INTO metas (usuario_id, titulo, categoria, data_inicio, xp_recompensa)
       VALUES ($1, 'Temporária', 'pessoal', '2026-09-01', 100) RETURNING id`,
      [outro],
    )
    await bd.query(
      `INSERT INTO tarefas (meta_id, usuario_id, titulo, recorrencia, inicio_em, xp)
       VALUES ($1, $2, 'Alguma', 'diaria', '2026-09-01', 10)`,
      [m[0].id, outro],
    )

    await bd.query(`DELETE FROM usuarios WHERE id = $1`, [outro])

    const { rows } = await bd.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM tarefas WHERE usuario_id = $1`,
      [outro],
    )
    assert.equal(rows[0].total, 0)
  })

  it('o cron não consegue registrar o mesmo envio duas vezes', async () => {
    const { rows: t } = await bd.query<{ id: string }>(
      `INSERT INTO tarefas (usuario_id, titulo, recorrencia, inicio_em, xp)
       VALUES ($1, 'Beber água', 'diaria', '2026-09-01', 10) RETURNING id`,
      [UID],
    )
    const registrar = () =>
      bd.query(
        `INSERT INTO envios_lembrete (usuario_id, tarefa_id, data_referencia, tipo)
         VALUES ($1, $2, '2026-09-21', 'lembrete')`,
        [UID, t[0].id],
      )
    await registrar()
    await assert.rejects(registrar, /duplicate key|unique/i)
  })

  it('username é único', async () => {
    await assert.rejects(
      () =>
        bd.query(
          `INSERT INTO usuarios (id, email, nome, username)
           VALUES ('33333333-3333-3333-3333-333333333333', 'outro@zelvo.app', 'Outro', $1)`,
          [UID],
        ),
      /duplicate key|unique/i,
    )
  })

  it('categoria fora da lista é recusada pelo banco', async () => {
    await assert.rejects(
      () =>
        bd.query(
          `INSERT INTO metas (usuario_id, titulo, categoria, data_inicio, xp_recompensa)
           VALUES ($1, 'Inválida', 'criptomoedas', '2026-09-01', 100)`,
          [UID],
        ),
      /invalid input value for enum|categoria/i,
    )
  })
})
