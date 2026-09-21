import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Em Next 16 este arquivo se chama `proxy.ts` — é o antigo `middleware.ts`,
 * renomeado. Ele roda antes de toda página e faz duas coisas:
 *
 * 1. Renova o token do Supabase e regrava o cookie. Sem isso, a sessão
 *    "persistente" morre quando o access token expira (1 hora), e o app
 *    instalado na tela de início pediria login o tempo todo.
 * 2. Barra rota privada sem sessão, antes de a página renderizar.
 */

/** Rotas que existem para quem ainda não entrou. */
const PUBLICAS = ['/entrar', '/auth']

function ehPublica(caminho: string): boolean {
  return PUBLICAS.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`))
}

export async function proxy(requisicao: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sem configuração, deixa passar: a própria página mostra um erro que
  // explica o que falta. Derrubar toda requisição aqui só esconderia a causa.
  if (!url || !anonKey) return NextResponse.next()

  let resposta = NextResponse.next({ request: requisicao })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return requisicao.cookies.getAll()
      },
      setAll(novos) {
        for (const { name, value } of novos) {
          requisicao.cookies.set(name, value)
        }
        resposta = NextResponse.next({ request: requisicao })
        for (const { name, value, options } of novos) {
          resposta.cookies.set(name, value, options)
        }
      },
    },
  })

  // Não trocar por `getSession()`: só o `getUser()` valida o token com o
  // servidor do Supabase, e é ele que dispara a renovação do cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const caminho = requisicao.nextUrl.pathname

  if (caminho === '/') {
    const destino = requisicao.nextUrl.clone()
    destino.pathname = user ? '/hoje' : '/entrar'
    return NextResponse.redirect(destino)
  }

  if (!user && !ehPublica(caminho)) {
    const destino = requisicao.nextUrl.clone()
    destino.pathname = '/entrar'
    // Volta para onde ele queria ir depois de entrar.
    destino.searchParams.set('proximo', caminho)
    return NextResponse.redirect(destino)
  }

  if (user && caminho === '/entrar') {
    const destino = requisicao.nextUrl.clone()
    destino.pathname = '/hoje'
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  return resposta
}

export const config = {
  matcher: [
    /*
     * Tudo, menos o que não tem sessão a renovar: assets do Next, ícones,
     * manifest e o service worker. O `sw.js` em especial não pode ser
     * redirecionado — o iOS recusa o registro se ele não vier com 200.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icons/).*)',
  ],
}
