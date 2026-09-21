import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { db } from '@/db/client'
import { clienteServidor } from '@/modulos/auth/supabase-servidor'
import { garantirPerfil } from '@/modulos/auth/perfil'

export const runtime = 'nodejs'

/**
 * Volta do link de confirmação de e-mail.
 *
 * O Supabase manda o usuário para cá de duas formas, dependendo do template
 * e do fluxo: `?token_hash=…&type=signup` (link mágico) ou `?code=…` (PKCE).
 * Os dois terminam no mesmo lugar — sessão criada e perfil garantido.
 *
 * Se a confirmação por e-mail estiver desligada no painel do Supabase, esta
 * rota simplesmente nunca é chamada.
 */
export async function GET(requisicao: NextRequest) {
  const parametros = requisicao.nextUrl.searchParams
  const tokenHash = parametros.get('token_hash')
  const tipo = parametros.get('type') as EmailOtpType | null
  const codigo = parametros.get('code')

  const supabase = await clienteServidor()

  let falha: string | null = null

  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
    falha = error?.message ?? null
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo)
    falha = error?.message ?? null
  } else {
    falha = 'Link de confirmação incompleto.'
  }

  const destino = requisicao.nextUrl.clone()
  destino.search = ''

  if (falha) {
    destino.pathname = '/entrar'
    // O link de confirmação vale uma vez só e expira; dizer isso evita a
    // conclusão errada de que a conta não foi criada.
    destino.searchParams.set('erro', 'confirmacao')
    return NextResponse.redirect(destino)
  }

  const { data } = await supabase.auth.getUser()
  if (data.user) {
    const metadados = (data.user.user_metadata ?? {}) as { nome?: string; username?: string }
    await garantirPerfil(db, {
      id: data.user.id,
      email: data.user.email ?? '',
      nome: metadados.nome,
      username: metadados.username,
    })
  }

  destino.pathname = '/hoje'
  return NextResponse.redirect(destino)
}
