import { z } from 'zod'

import { errosPorCampo } from '../comum/formulario'

// Reexportado para não quebrar quem já importa daqui; a definição mora em
// `comum/formulario`, porque metas e tarefas usam o mesmo formato.
export { errosPorCampo }

/**
 * Validação de entrada da autenticação.
 *
 * Fica separada das Server Actions de propósito: são funções puras, então
 * dá para testar as regras sem subir Supabase nenhum. Nada que vem do
 * cliente entra no banco sem passar por aqui.
 */

const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,19}$/

export const esquemaEmail = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .email('E-mail inválido.')
  .transform((valor) => valor.toLowerCase())

export const esquemaSenha = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .max(72, 'A senha passou de 72 caracteres.')

export const esquemaNome = z
  .string()
  .trim()
  .min(2, 'Informe seu nome.')
  .max(60, 'Nome muito longo.')

export const esquemaUsername = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_REGEX,
    'Use de 3 a 20 caracteres: comece com letra e use só letras, números e _.',
  )

export const esquemaEntrar = z.object({
  email: esquemaEmail,
  senha: z.string().min(1, 'Informe a senha.'),
})

export const esquemaCadastro = z.object({
  nome: esquemaNome,
  username: esquemaUsername,
  email: esquemaEmail,
  senha: esquemaSenha,
})

export type DadosEntrar = z.infer<typeof esquemaEntrar>
export type DadosCadastro = z.infer<typeof esquemaCadastro>

/**
 * Primeiro palpite de username a partir do e-mail, só para pré-preencher o
 * campo. O usuário pode trocar, e a validação acima continua valendo.
 */
export function sugerirUsername(email: string): string {
  const local = email.split('@')[0] ?? ''
  const limpo = local
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 20)

  return limpo.length >= 3 ? limpo : ''
}


/**
 * Para onde mandar o usuário depois do login. Só aceita destino interno:
 * sem isso, `?proximo=https://outro.site` viraria um redirecionamento aberto
 * logo depois de alguém digitar a senha.
 */
export function destinoSeguro(bruto: unknown): string {
  const valor = typeof bruto === 'string' ? bruto.trim() : ''

  // `//outro.site` e `/\outro.site` são absolutos para o navegador, mesmo
  // começando com barra.
  if (!valor.startsWith('/')) return '/hoje'
  if (valor.startsWith('//') || valor.startsWith('/\\')) return '/hoje'
  if (valor.includes('://')) return '/hoje'

  // Voltar para a raiz ou para o próprio login depois de entrar seria um laço.
  if (valor === '/' || valor === '/entrar') return '/hoje'

  return valor
}
