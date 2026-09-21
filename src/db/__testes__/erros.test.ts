import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { codigoDeErro, mensagemDeErro, traduzirErroDeBanco } from '../erros'

describe('erros de banco', () => {
  it('aponta o campo errado da connection string por código', () => {
    const casos: Array<[string, RegExp]> = [
      ['ENOTFOUND', /pooler\.supabase\.com/],
      ['ECONNREFUSED', /6543/],
      ['ETIMEDOUT', /6543/],
      ['28P01', /Senha do banco incorreta/],
      ['28000', /postgres\.<ref-do-projeto>/],
      ['3D000', /não existe/],
      ['42P01', /supabase-setup\.sql/],
    ]

    for (const [codigo, esperado] of casos) {
      const erro = Object.assign(new Error('falhou'), { code: codigo })
      assert.match(traduzirErroDeBanco(erro), esperado, `código ${codigo}`)
    }
  })

  it('reconhece o pooler recusando prepared statement', () => {
    const erro = new Error('prepared statement "s1" already exists')
    assert.match(traduzirErroDeBanco(erro), /prepare: false/)
  })

  it('devolve a mensagem pronta quando a variável não existe', () => {
    const erro = new Error('DATABASE_URL não está configurada. Pegue a connection string...')
    assert.match(traduzirErroDeBanco(erro), /^DATABASE_URL não está configurada/)
  })

  it('não inventa explicação para erro desconhecido', () => {
    assert.equal(traduzirErroDeBanco(new Error('qualquer coisa')), '')
    assert.equal(traduzirErroDeBanco('nem erro é'), '')
  })

  it('nunca repete a connection string na mensagem', () => {
    // A senha e o host chegam dentro da mensagem de alguns drivers; nada disso
    // pode voltar para a tela do usuário.
    const erro = Object.assign(
      new Error('connect ENOTFOUND postgres://usuario:senhaSecreta@host:6543/postgres'),
      { code: 'ENOTFOUND' },
    )
    const texto = traduzirErroDeBanco(erro)
    assert.equal(texto.includes('senhaSecreta'), false)
    assert.equal(texto.includes('postgres://'), false)
  })

  it('extrai o código só quando ele existe e é texto', () => {
    assert.equal(codigoDeErro(Object.assign(new Error('x'), { code: '28P01' })), '28P01')
    assert.equal(codigoDeErro(Object.assign(new Error('x'), { code: 42 })), null)
    assert.equal(codigoDeErro(new Error('x')), null)
    assert.equal(codigoDeErro(null), null)
  })
})

describe('erro embrulhado pelo Drizzle', () => {
  // O Drizzle entrega `DrizzleQueryError: Failed query: select 1` e esconde a
  // causa real no `cause`. Se a tradução olhar só o erro de cima, o usuário
  // recebe "Failed query" e nada mais.
  function embrulhar(interno: Error): Error {
    return Object.assign(new Error('Failed query: select 1\nparams: '), { cause: interno })
  }

  it('acha o código lá dentro', () => {
    const interno = Object.assign(new Error('getaddrinfo ENOTFOUND host'), { code: 'ENOTFOUND' })
    assert.equal(codigoDeErro(embrulhar(interno)), 'ENOTFOUND')
    assert.match(traduzirErroDeBanco(embrulhar(interno)), /pooler\.supabase\.com/)
  })

  it('acha o código dois níveis abaixo', () => {
    const raiz = Object.assign(new Error('senha errada'), { code: '28P01' })
    const meio = Object.assign(new Error('write CONNECT_ERROR'), { cause: raiz })
    assert.match(traduzirErroDeBanco(embrulhar(meio)), /Senha do banco incorreta/)
  })

  it('mensagemDeErro prefere a causa ao embrulho', () => {
    const interno = new Error('getaddrinfo ENOTFOUND nao-existe.pooler.supabase.com')
    assert.equal(mensagemDeErro(embrulhar(interno)), interno.message)
    // E não deixa a quebra de linha do embrulho vazar para a tela.
    assert.equal(mensagemDeErro(embrulhar(new Error(''))).includes('\n'), false)
  })

  it('não entra em laço se a causa apontar para si mesma', () => {
    const laco: Error & { cause?: unknown } = new Error('ciclo')
    laco.cause = laco
    assert.equal(codigoDeErro(laco), null)
    assert.equal(mensagemDeErro(laco), 'ciclo')
  })
})
