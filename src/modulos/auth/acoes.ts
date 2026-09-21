'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { usuarios } from '@/db/schema'
import { mensagemDeErro, traduzirErroDeBanco } from '@/db/erros'
import { clienteServidor } from './supabase-servidor'
import { garantirPerfil } from './perfil'
import {
  destinoSeguro,
  errosPorCampo,
  esquemaCadastro,
  esquemaEntrar,
} from './validacao'

/**
 * Server Actions da autenticação.
 *
 * Tudo que vem do formulário passa pelo Zod antes de qualquer coisa. O
 * `usuario_id` nunca vem do cliente: sai sempre da sessão do Supabase.
 *
 * As funções `tentar*` fazem o trabalho e nunca redirecionam. O `redirect()`
 * fica só nas exportadas, fora do try, porque ele funciona lançando uma
 * exceção — dentro de um catch ele viraria "erro inesperado".
 */

export type EstadoFormulario = {
  erros?: Record<string, string>
  aviso?: string
}

type Resultado = EstadoFormulario | { destino: string }

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

/**
 * Rede de segurança: qualquer falha não prevista vira texto na tela em vez de
 * uma requisição vermelha sem explicação. O erro completo continua indo para
 * o log da Vercel.
 */
function erroInesperado(erro: unknown, onde: string): EstadoFormulario {
  console.error(`[zelvo:${onde}]`, erro)

  const deBanco = traduzirErroDeBanco(erro)
  if (deBanco) return { erros: { formulario: deBanco } }

  return {
    erros: {
      formulario: `Falha inesperada no servidor: ${mensagemDeErro(erro)}`,
    },
  }
}

async function tentarEntrar(formulario: FormData): Promise<Resultado> {
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

  return { destino: destinoSeguro(formulario.get('proximo')) }
}

async function tentarCadastrar(formulario: FormData): Promise<Resultado> {
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

  return { destino: '/hoje' }
}

export async function entrar(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  let resultado: Resultado
  try {
    resultado = await tentarEntrar(formulario)
  } catch (erro) {
    return erroInesperado(erro, 'entrar')
  }

  if ('destino' in resultado) {
    revalidatePath('/', 'layout')
    redirect(resultado.destino)
  }
  return resultado
}

export async function cadastrar(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  let resultado: Resultado
  try {
    resultado = await tentarCadastrar(formulario)
  } catch (erro) {
    return erroInesperado(erro, 'cadastrar')
  }

  if ('destino' in resultado) {
    revalidatePath('/', 'layout')
    redirect(resultado.destino)
  }
  return resultado
}

export async function sair(): Promise<void> {
  try {
    const supabase = await clienteServidor()
    await supabase.auth.signOut()
  } catch (erro) {
    // Sair nunca pode travar o usuário dentro do app.
    console.error('[zelvo:sair]', erro)
  }
  revalidatePath('/', 'layout')
  redirect('/entrar')
}
