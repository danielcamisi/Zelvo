'use client'

import { createBrowserClient } from '@supabase/ssr'
import { configSupabase } from './config'

/**
 * Cliente do Supabase no navegador. Usado só para o que precisa acontecer
 * no cliente (hoje, nada além de reagir a logout em outra aba). Leitura e
 * escrita de dados continuam sendo sempre no servidor.
 */
export function clienteNavegador() {
  const { url, anonKey } = configSupabase()
  return createBrowserClient(url, anonKey)
}
