import { and, eq, ne } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { configUsuario, progressoUsuario, usuarios } from '@/db/schema'
import { sugerirUsername } from './validacao'

/**
 * O Supabase guarda a identidade em `auth.users`; o Zelvo guarda o resto em
 * `usuarios`. Esta função garante que a segunda exista para quem acabou de
 * entrar, junto das duas linhas que todo usuário precisa ter desde o
 * primeiro segundo: progresso (nível 1, 0 XP) e configuração (tom, horários).
 *
 * É chamada depois do cadastro e também a cada entrada, porque o cadastro
 * pode terminar em confirmação por e-mail — nesse caso o usuário só volta
 * de verdade quando clica no link.
 *
 * Idempotente: rodar de novo não duplica nem sobrescreve nada.
 */

/**
 * Qualquer conexão Drizzle com este schema serve. É o que permite testar a
 * função contra um Postgres em memória (PGlite), sem Supabase nenhum.
 */
export type BancoZelvo = PgDatabase<PgQueryResultHKT, any, any>

export type DadosPerfil = {
  id: string
  email: string
  nome?: string | null
  username?: string | null
  timezone?: string | null
}

/**
 * Deixa o username livre: se já for de outra pessoa, vai somando sufixo.
 * `usuarios.username` é UNIQUE, e um choque derrubaria o cadastro com um
 * erro de banco que não diz nada a quem está na tela.
 */
export async function usernameLivre(
  db: BancoZelvo,
  desejado: string,
  idDonoAtual: string,
): Promise<string> {
  const base = desejado.slice(0, 16) || 'usuario'

  for (let sufixo = 0; sufixo < 50; sufixo += 1) {
    const candidato = sufixo === 0 ? base : `${base}${sufixo}`
    const ocupados = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.username, candidato), ne(usuarios.id, idDonoAtual)))
      .limit(1)

    if (ocupados.length === 0) return candidato
  }

  // 50 colisões seguidas não acontece na prática; ainda assim, nada de
  // devolver um username que vai estourar o UNIQUE.
  return `${base}${Date.now().toString(36).slice(-6)}`
}

export async function garantirPerfil(db: BancoZelvo, dados: DadosPerfil): Promise<void> {
  const existente = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.id, dados.id))
    .limit(1)

  if (existente.length === 0) {
    const desejado =
      dados.username?.trim().toLowerCase() || sugerirUsername(dados.email) || 'usuario'
    const username = await usernameLivre(db, desejado, dados.id)

    await db
      .insert(usuarios)
      .values({
        id: dados.id,
        email: dados.email,
        nome: dados.nome?.trim() || dados.email.split('@')[0] || 'Sem nome',
        username,
        ...(dados.timezone ? { timezone: dados.timezone } : {}),
      })
      .onConflictDoNothing()
  }

  // Estas duas nascem com os defaults do schema: nível 1, 0 XP, tom sincero,
  // resumo 07:00, cobrança 21:00, notificações desligadas até o usuário permitir.
  await db.insert(progressoUsuario).values({ usuarioId: dados.id }).onConflictDoNothing()
  await db.insert(configUsuario).values({ usuarioId: dados.id }).onConflictDoNothing()
}
