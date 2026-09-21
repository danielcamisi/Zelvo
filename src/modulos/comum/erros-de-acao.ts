import { mensagemDeErro, traduzirErroDeBanco } from '@/db/erros'
import type { EstadoFormulario } from './formulario'

/**
 * Rede de segurança de toda Server Action: qualquer falha não prevista vira
 * texto na tela em vez de uma requisição vermelha sem explicação. O erro
 * completo continua indo para o log da Vercel.
 */
export function erroInesperado(erro: unknown, onde: string): EstadoFormulario {
  console.error(`[zelvo:${onde}]`, erro)

  const deBanco = traduzirErroDeBanco(erro)
  if (deBanco) return { erros: { formulario: deBanco } }

  return { erros: { formulario: `Falha inesperada no servidor: ${mensagemDeErro(erro)}` } }
}
