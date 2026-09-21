import 'server-only'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { db } from '@/db/client'
import { configUsuario, progressoUsuario, usuarios } from '@/db/schema'
import { clienteServidor } from './supabase-servidor'
import { garantirPerfil } from './perfil'

/**
 * Quem está logado, do ponto de vista do app.
 *
 * Sempre `auth.getUser()`, nunca `auth.getSession()`: o primeiro valida o
 * token com o servidor do Supabase, o segundo só lê o cookie — e cookie é
 * coisa que o cliente manda.
 */
export async function usuarioAutenticado() {
  const supabase = await clienteServidor()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export type UsuarioZelvo = {
  id: string
  email: string
  nome: string
  username: string
  avatarUrl: string | null
  timezone: string
  nivel: number
  xpTotal: number
  rank: string
  streakAtual: number
}

/**
 * Perfil completo de quem está logado, já garantindo que as linhas do Zelvo
 * existam. Devolve `null` quando não há sessão.
 */
export async function usuarioAtual(): Promise<UsuarioZelvo | null> {
  const autenticado = await usuarioAutenticado()
  if (!autenticado) return null

  const metadados = (autenticado.user_metadata ?? {}) as { nome?: string; username?: string }

  await garantirPerfil(db, {
    id: autenticado.id,
    email: autenticado.email ?? '',
    nome: metadados.nome,
    username: metadados.username,
  })

  const linhas = await db
    .select({
      id: usuarios.id,
      email: usuarios.email,
      nome: usuarios.nome,
      username: usuarios.username,
      avatarUrl: usuarios.avatarUrl,
      timezone: usuarios.timezone,
      nivel: progressoUsuario.nivel,
      xpTotal: progressoUsuario.xpTotal,
      rank: progressoUsuario.rank,
      streakAtual: progressoUsuario.streakAtual,
    })
    .from(usuarios)
    .innerJoin(progressoUsuario, eq(progressoUsuario.usuarioId, usuarios.id))
    .where(eq(usuarios.id, autenticado.id))
    .limit(1)

  return linhas[0] ?? null
}

/**
 * Para páginas que não fazem sentido sem sessão. Manda para o login em vez
 * de quebrar.
 */
export async function exigirUsuario(): Promise<UsuarioZelvo> {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/entrar')
  return usuario
}

/** Configuração de tom e horários. Usada pelas telas de perfil e pelos lembretes. */
export async function configDoUsuario(usuarioId: string) {
  const linhas = await db
    .select()
    .from(configUsuario)
    .where(eq(configUsuario.usuarioId, usuarioId))
    .limit(1)
  return linhas[0] ?? null
}
