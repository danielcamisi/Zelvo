import type { z } from 'zod'

/**
 * O contrato entre uma Server Action e o formulário que a chama.
 *
 * Fica em `comum` porque metas, tarefas e autenticação usam o mesmo formato:
 * um mapa campo → mensagem, e a chave `formulario` para o que não pertence a
 * nenhum campo.
 */
export type EstadoFormulario = {
  erros?: Record<string, string>
  aviso?: string
}

/** Primeira mensagem de cada campo. O formulário exibe uma por vez. */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const mapa: Record<string, string> = {}
  for (const problema of erro.issues) {
    const campo = String(problema.path[0] ?? 'formulario')
    if (!(campo in mapa)) mapa[campo] = problema.message
  }
  return mapa
}
