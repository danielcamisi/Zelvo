import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { configSupabase } from './config'

/**
 * Cliente do Supabase para código de servidor (Server Component, Server
 * Action, Route Handler). A sessão vive em cookie; este cliente lê e
 * regrava esse cookie quando o token é renovado.
 */
export async function clienteServidor() {
  // `cookies()` primeiro, de propósito: é ele que marca a rota como dinâmica.
  // Se a checagem de configuração viesse antes, um ambiente sem as variáveis
  // faria o Next tentar pré-renderizar a página e quebrar o build, em vez de
  // mostrar o erro em tempo de execução.
  const armazem = await cookies()
  const { url, anonKey } = configSupabase()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return armazem.getAll()
      },
      setAll(novos) {
        try {
          for (const { name, value, options } of novos) {
            armazem.set(name, value, options)
          }
        } catch {
          // Server Component não pode escrever cookie. Tudo bem: o proxy
          // já renovou a sessão antes de a página renderizar.
        }
      },
    },
  })
}
