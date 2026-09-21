/**
 * Testes da autenticação que não dependem do Supabase.
 *
 * A validação é pura. O perfil roda contra um Postgres em memória (PGlite),
 * com as mesmas migrations que vão para o Supabase — então o que passa aqui
 * passa lá, inclusive as UNIQUEs.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'

import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq } from 'drizzle-orm'

import * as schema from '../../../db/schema'
import { configUsuario, progressoUsuario, usuarios } from '../../../db/schema'
import { garantirPerfil, usernameLivre } from '../perfil'
import {
  destinoSeguro,
  errosPorCampo,
  esquemaCadastro,
  esquemaEntrar,
  sugerirUsername,
} from '../validacao'

describe('validação do formulário', () => {
  it('normaliza e-mail, nome e username', () => {
    const saida = esquemaCadastro.safeParse({
      nome: '  Daniel  ',
      username: 'Daniel_C',
      email: '  DAN@Exemplo.COM ',
      senha: 'senhaforte1',
    })

    assert.equal(saida.success, true)
    assert.deepEqual(saida.success && saida.data, {
      nome: 'Daniel',
      username: 'daniel_c',
      email: 'dan@exemplo.com',
      senha: 'senhaforte1',
    })
  })

  it('recusa username que não começa com letra, e-mail inválido e senha curta', () => {
    const saida = esquemaCadastro.safeParse({
      nome: 'D',
      username: '1abc',
      email: 'sem-arroba',
      senha: '123',
    })

    assert.equal(saida.success, false)
    const erros = saida.success ? {} : errosPorCampo(saida.error)
    assert.deepEqual(Object.keys(erros).sort(), ['email', 'nome', 'senha', 'username'])
  })

  it('no login não exige senha forte, só que exista', () => {
    // Senha antiga e curta ainda precisa conseguir entrar.
    assert.equal(esquemaEntrar.safeParse({ email: 'a@b.co', senha: 'x' }).success, true)
    assert.equal(esquemaEntrar.safeParse({ email: 'a@b.co', senha: '' }).success, false)
  })

  it('sugere username a partir do e-mail e desiste quando não dá', () => {
    assert.equal(sugerirUsername('daniel.camisi+zelvo@gmail.com'), 'danielcamisizelvo')
    assert.equal(sugerirUsername('joão@x.com'), 'joao')
    // Só número antes do @: não existe username válido a sugerir.
    assert.equal(sugerirUsername('123@x.com'), '')
  })
})

describe('destino depois do login', () => {
  it('aceita caminho interno', () => {
    assert.equal(destinoSeguro('/metas/nova'), '/metas/nova')
    assert.equal(destinoSeguro('/hoje'), '/hoje')
  })

  it('recusa qualquer coisa que leve para fora', () => {
    for (const bruto of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'http://localhost:3000/hoje',
      '',
      null,
      undefined,
      42,
    ]) {
      assert.equal(destinoSeguro(bruto), '/hoje', `deveria barrar: ${String(bruto)}`)
    }
  })

  it('não volta para a raiz nem para o próprio login', () => {
    assert.equal(destinoSeguro('/'), '/hoje')
    assert.equal(destinoSeguro('/entrar'), '/hoje')
  })
})

describe('perfil do usuário', () => {
  let bd: PGlite
  let db: ReturnType<typeof drizzle<typeof schema>>

  before(async () => {
    bd = new PGlite()
    const pasta = join(process.cwd(), 'drizzle')
    for (const arquivo of readdirSync(pasta).filter((n) => n.endsWith('.sql')).sort()) {
      const sql = readFileSync(join(pasta, arquivo), 'utf8')
      for (const comando of sql.split('--> statement-breakpoint')) {
        if (comando.trim()) await bd.exec(comando)
      }
    }
    db = drizzle(bd, { schema })
  })

  after(async () => {
    await bd?.close()
  })

  const ID_A = '11111111-1111-4111-8111-111111111111'
  const ID_B = '22222222-2222-4222-8222-222222222222'

  it('cria usuário, progresso e config no primeiro acesso', async () => {
    await garantirPerfil(db, {
      id: ID_A,
      email: 'daniel@zelvo.app',
      nome: 'Daniel',
      username: 'daniel',
    })

    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, ID_A))
    assert.equal(usuario.nome, 'Daniel')
    assert.equal(usuario.username, 'daniel')
    assert.equal(usuario.timezone, 'America/Sao_Paulo')

    const [progresso] = await db
      .select()
      .from(progressoUsuario)
      .where(eq(progressoUsuario.usuarioId, ID_A))
    assert.equal(progresso.nivel, 1)
    assert.equal(progresso.xpTotal, 0)
    assert.equal(progresso.rank, 'Iniciante')

    const [config] = await db
      .select()
      .from(configUsuario)
      .where(eq(configUsuario.usuarioId, ID_A))
    assert.equal(config.tomFoco, 'sincero')
    assert.equal(config.notificacoesAtivas, false)
  })

  it('rodar de novo não duplica nem sobrescreve', async () => {
    await db
      .update(progressoUsuario)
      .set({ xpTotal: 900, nivel: 4 })
      .where(eq(progressoUsuario.usuarioId, ID_A))

    await garantirPerfil(db, {
      id: ID_A,
      email: 'daniel@zelvo.app',
      nome: 'Outro Nome',
      username: 'outro',
    })

    const linhas = await db.select().from(usuarios).where(eq(usuarios.id, ID_A))
    assert.equal(linhas.length, 1)
    assert.equal(linhas[0].nome, 'Daniel')

    const [progresso] = await db
      .select()
      .from(progressoUsuario)
      .where(eq(progressoUsuario.usuarioId, ID_A))
    assert.equal(progresso.xpTotal, 900)
  })

  it('desvia o username quando já é de outra pessoa', async () => {
    const livre = await usernameLivre(db, 'daniel', ID_B)
    assert.equal(livre, 'daniel1')

    // E o próprio dono continua podendo ficar com o dele.
    assert.equal(await usernameLivre(db, 'daniel', ID_A), 'daniel')
  })

  it('sem nome e sem username, deriva os dois do e-mail', async () => {
    await garantirPerfil(db, { id: ID_B, email: 'camisi@zelvo.app' })

    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, ID_B))
    assert.equal(usuario.nome, 'camisi')
    assert.equal(usuario.username, 'camisi')
  })
})
