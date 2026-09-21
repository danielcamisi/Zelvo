'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db/client'
import { usuarios } from '@/db/schema'
import { configSupabase } from '@/modulos/auth/config'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { erroInesperado } from '@/modulos/comum/erros-de-acao'
import { urlDeAvatarValida } from './avatar'

export type ResultadoAvatar = { ok: true } | { ok: false; motivo: string }

/**
 * Grava (ou apaga) o endereço da foto de perfil.
 *
 * O arquivo em si sobe direto do navegador para o Storage do Supabase, com
 * a sessão do próprio usuário — não passa por aqui. Uma Server Action tem
 * limite de corpo pequeno e mandar imagem por ela derrubaria o envio no
 * celular. O que o servidor faz é o que o servidor precisa fazer: conferir
 * que o endereço é da pasta desta pessoa antes de gravar.
 */
export async function salvarAvatar(url: string | null): Promise<ResultadoAvatar> {
  try {
    const usuario = await exigirUsuario()

    if (url !== null) {
      const { url: urlDoSupabase } = configSupabase()
      if (!urlDeAvatarValida(url, urlDoSupabase, usuario.id)) {
        return { ok: false, motivo: 'Endereço de imagem inválido.' }
      }
    }

    await db.update(usuarios).set({ avatarUrl: url }).where(eq(usuarios.id, usuario.id))

    revalidatePath('/perfil')
    revalidatePath('/hoje')
    return { ok: true }
  } catch (erro) {
    const { erros } = erroInesperado(erro, 'salvarAvatar')
    return { ok: false, motivo: erros?.formulario ?? 'Não foi possível salvar a foto agora.' }
  }
}
