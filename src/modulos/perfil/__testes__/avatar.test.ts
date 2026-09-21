import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { caminhoDoAvatar, urlDeAvatarValida } from '../avatar'

const SUPABASE = 'https://jvixilufgchgwfrdyoib.supabase.co'
const EU = '11111111-1111-1111-1111-111111111111'
const OUTRO = '22222222-2222-2222-2222-222222222222'

function publica(usuarioId: string) {
  return `${SUPABASE}/storage/v1/object/public/avatares/${usuarioId}/avatar.jpg`
}

describe('endereço da foto de perfil', () => {
  it('guarda a foto na pasta com o id do dono', () => {
    assert.equal(caminhoDoAvatar(EU), `${EU}/avatar.jpg`)
  })

  it('aceita a foto do próprio usuário, com e sem carimbo de tempo', () => {
    assert.equal(urlDeAvatarValida(publica(EU), SUPABASE, EU), true)
    assert.equal(urlDeAvatarValida(`${publica(EU)}?v=1789999999999`, SUPABASE, EU), true)
  })

  it('recusa a pasta de outra pessoa', () => {
    assert.equal(urlDeAvatarValida(publica(OUTRO), SUPABASE, EU), false)
  })

  it('recusa endereço fora do Supabase', () => {
    // Sem isto, salvar a foto viraria "grave qualquer endereço no meu perfil".
    assert.equal(
      urlDeAvatarValida(`https://exemplo.invalido/storage/v1/object/public/avatares/${EU}/a.jpg`, SUPABASE, EU),
      false,
    )
  })

  it('recusa outro bucket do mesmo projeto', () => {
    assert.equal(
      urlDeAvatarValida(`${SUPABASE}/storage/v1/object/public/outro/${EU}/avatar.jpg`, SUPABASE, EU),
      false,
    )
  })

  it('aceita a URL do Supabase terminada em barra', () => {
    assert.equal(urlDeAvatarValida(publica(EU), `${SUPABASE}/`, EU), true)
  })

  it('recusa endereço absurdamente longo', () => {
    assert.equal(urlDeAvatarValida(`${publica(EU)}?v=${'9'.repeat(600)}`, SUPABASE, EU), false)
  })
})
