'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { usuarios } from '@/db/schema'
import { clienteServidor } from './supabase-servidor'
import { garantirPerfil } from './perfil'
import { destinoSeguro, errosPorCampo, esquemaCadastro, esquemaEntrar } from './validacao'

/**
 * Server Actions da autenticação.
 *
 * Tudo que vem do formulário passa pelo Zod antes de qualquer coisa. O
 * `usuario_id` nunca vem do cliente: sai sempre da sessão do Supabase.
 */

export type EstadoFormulario = {
  erros?: Record<string, string>
  aviso?: string
}

/** Mensagens do Supabase vêm em inglês e cruas. Traduz o que o usuário pode consertar. */
function traduzirErro(codigo: string | undefined, mensagem: string): string {
  switch (codigo) {
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.'
    case 'email_not_confirmed':
      return 'Confirme o e-mail pelo link que o Supabase enviou e tente de novo.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Esse e-mail já tem conta. Entre em vez de cadastrar.'
    case 'weak_password':
      return 'Senha fraca demais. Use pelo menos 8 caracteres.'
    case 'over_email_send_rate_limit':
      return 'O Supabase limitou o envio de e-mails. Espere alguns minutos e tente de novo.'
    case 'signup_disabled':
      return 'O cadastro está desligado no painel do Supabase (Authentication → Sign In / Providers).'
    default:
      return mensagem || 'Não deu para completar. Tente de novo.'
  }
}

export async function entrar(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const entrada = esquemaEntrar.safeParse({
    email: formulario.get('email'),
    senha: formulario.get('senha'),
  })
  if (!entrada.success) return { erros: errosPorCampo(entrada.error) }

  const supabase = await clienteServidor()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: entrada.data.email,
    password: entrada.data.senha,
  })

  if (error || !data.user) {
    return { erros: { formulario: traduzirErro(error?.code, error?.message ?? '') } }
  }

  const metadados = (data.user.user_metadata ?? {}) as { nome?: string; username?: string }
  await garantirPerfil(db, {
    id: data.user.id,
    email: data.user.email ?? entrada.data.email,
    nome: metadados.nome,
    username: metadados.username,
  })

  revalidatePath('/', 'layout')
  redirect(destinoSeguro(formulario.get('proximo')))
}

export async function cadastrar(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const entrada = esquemaCadastro.safeParse({
    nome: formulario.get('nome'),
    username: formulario.get('username'),
    email: formulario.get('email'),
    senha: formulario.get('senha'),
  })
  if (!entrada.success) return { erros: errosPorCampo(entrada.error) }

  // O username é escolha do usuário, então um choque aqui é erro dele para
  // corrigir na tela — não é caso de renomear por baixo dos panos.
  const jaUsado = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.username, entrada.data.username))
    .limit(1)

  if (jaUsado.length > 0) {
    return { erros: { username: 'Esse username já está em uso. Escolha outro.' } }
  }

  const supabase = await clienteServidor()
  const { data, error } = await supabase.auth.signUp({
    email: entrada.data.email,
    password: entrada.data.senha,
    options: { data: { nome: entrada.data.nome, username: entrada.data.username } },
  })

  if (error || !data.user) {
    return { erros: { formulario: traduzirErro(error?.code, error?.message ?? '') } }
  }

  // Sem sessão aqui significa que o projeto exige confirmação por e-mail. O
  // perfil só é criado quando ele voltar pelo link e a sessão existir.
  if (!data.session) {
    return {
      aviso:
        'Conta criada. Confirme pelo link que chegou no seu e-mail e depois entre por aqui.',
    }
  }

  await garantirPerfil(db, {
    id: data.user.id,
    email: data.user.email ?? entrada.data.email,
    nome: entrada.data.nome,
    username: entrada.data.username,
  })

  revalidatePath('/', 'layout')
  redirect('/hoje')
}

export async function sair(): Promise<void> {
  const supabase = await clienteServidor()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/entrar')
}
