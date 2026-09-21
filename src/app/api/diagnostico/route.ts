import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { codigoDeErro, mensagemDeErro, traduzirErroDeBanco } from '@/db/erros'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Diagnóstico de configuração, para abrir no celular quando algo falha.
 *
 * Responde só com "existe / não existe" e com o código do erro. Nunca devolve
 * o valor de variável nenhuma, nem a connection string, nem a senha — é uma
 * rota aberta, e tem de continuar inofensiva se alguém achar o endereço.
 */
export async function GET() {
  const variaveis = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: Boolean(process.env.VAPID_PRIVATE_KEY),
    VAPID_SUBJECT: Boolean(process.env.VAPID_SUBJECT),
  }

  let banco: { ok: boolean; codigo?: string | null; explicacao?: string }
  try {
    // `select 1` prova a conexão; a contagem prova que o SQL do Supabase rodou.
    await db.execute(sql`select 1`)
    const linhas = await db.execute<{ total: number }>(
      sql`select count(*)::int as total from usuarios`,
    )
    const total = Array.isArray(linhas) ? (linhas[0]?.total ?? 0) : 0
    banco = { ok: true, explicacao: `Conectou. ${total} usuário(s) cadastrado(s).` }
  } catch (erro) {
    banco = {
      ok: false,
      codigo: codigoDeErro(erro),
      explicacao: traduzirErroDeBanco(erro) || mensagemDeErro(erro),
    }
  }

  let supabase: { ok: boolean; explicacao: string }
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!urlSupabase) {
    supabase = { ok: false, explicacao: 'NEXT_PUBLIC_SUPABASE_URL não está configurada.' }
  } else {
    try {
      const resposta = await fetch(`${urlSupabase}/auth/v1/health`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
        cache: 'no-store',
      })
      supabase = {
        ok: resposta.ok,
        explicacao: resposta.ok
          ? 'Auth do Supabase respondeu.'
          : `Auth do Supabase respondeu ${resposta.status}. Confira a URL e a anon key.`,
      }
    } catch (erro) {
      supabase = {
        ok: false,
        explicacao: `Não deu para alcançar o Supabase: ${mensagemDeErro(erro, 160)}`,
      }
    }
  }

  const tudoOk = Object.values(variaveis).every(Boolean) && banco.ok && supabase.ok

  return NextResponse.json(
    { ok: tudoOk, variaveis, banco, supabase },
    { status: tudoOk ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  )
}
