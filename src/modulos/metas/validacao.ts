import { z } from 'zod'

import { ehDataISO } from '@/regras/datas'
import { xpDaMeta } from '@/regras/xp'

/**
 * Regras de entrada de uma meta.
 *
 * Pura e testável: nada aqui toca banco nem sessão. O `usuarioId` não
 * aparece de propósito — ele vem sempre da sessão, nunca do formulário.
 */

const CATEGORIAS = ['saude', 'fitness', 'financas', 'estudos', 'carreira', 'produtividade', 'pessoal'] as const
const PRIORIDADES = ['baixa', 'media', 'alta', 'critica'] as const
const DIFICULDADES = ['facil', 'media', 'dificil'] as const
const VISIBILIDADES = ['privada', 'publica'] as const

export const dataObrigatoria = z
  .string()
  .trim()
  .refine(ehDataISO, 'Data inválida.')

export const dataOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : valor))
  .refine((valor) => valor === null || ehDataISO(valor), 'Data inválida.')

/**
 * Dinheiro chega como texto do formulário. Aceita vírgula, porque é assim
 * que se digita em português, e devolve o formato que o Postgres `numeric`
 * espera. Guardar em texto evita o arredondamento de ponto flutuante.
 */
export const valorMonetario = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : valor.replace(/\./g, '').replace(',', '.')))
  .refine(
    (valor) => valor === null || (/^\d+(\.\d{1,2})?$/.test(valor) && Number(valor) < 1e10),
    'Informe um valor como 1500 ou 1500,50.',
  )

export const esquemaMeta = z
  .object({
    titulo: z.string().trim().min(2, 'Dê um título à meta.').max(80, 'Título muito longo.'),
    descricao: z
      .string()
      .trim()
      .max(500, 'Descrição muito longa.')
      .transform((valor) => (valor === '' ? null : valor)),
    categoria: z.enum(CATEGORIAS, { message: 'Escolha uma categoria.' }),
    prioridade: z.enum(PRIORIDADES, { message: 'Escolha uma prioridade.' }),
    dificuldade: z.enum(DIFICULDADES, { message: 'Escolha uma dificuldade.' }),
    dataInicio: dataObrigatoria,
    prazo: dataOpcional,
    visibilidade: z.enum(VISIBILIDADES).default('privada'),
    valorAlvo: valorMonetario,
    valorAtual: valorMonetario,
  })
  .superRefine((dados, contexto) => {
    if (dados.prazo && dados.prazo < dados.dataInicio) {
      contexto.addIssue({
        code: 'custom',
        path: ['prazo'],
        message: 'O prazo não pode ser antes do início.',
      })
    }

    // Valor só faz sentido em meta financeira. Aceitar fora disso deixaria
    // um número órfão no banco que nenhuma tela sabe mostrar.
    if (dados.categoria !== 'financas' && (dados.valorAlvo || dados.valorAtual)) {
      contexto.addIssue({
        code: 'custom',
        path: ['valorAlvo'],
        message: 'Valor em dinheiro só vale para metas de Finanças.',
      })
    }

    if (dados.valorAtual && !dados.valorAlvo) {
      contexto.addIssue({
        code: 'custom',
        path: ['valorAlvo'],
        message: 'Informe o valor que quer alcançar.',
      })
    }
  })

export type DadosMeta = z.infer<typeof esquemaMeta>

/**
 * O XP de uma meta é calculado, nunca digitado. Se viesse do formulário,
 * bastaria editar o HTML para se dar mil pontos.
 */
export function xpDaMetaValidada(dados: Pick<DadosMeta, 'dificuldade' | 'prioridade'>): number {
  return xpDaMeta(dados.dificuldade, dados.prioridade)
}

/** Lê o formulário no formato que o esquema espera. */
export function lerFormularioDeMeta(formulario: FormData) {
  return {
    titulo: formulario.get('titulo') ?? '',
    descricao: formulario.get('descricao') ?? '',
    categoria: formulario.get('categoria') ?? '',
    prioridade: formulario.get('prioridade') ?? 'media',
    dificuldade: formulario.get('dificuldade') ?? 'media',
    dataInicio: formulario.get('dataInicio') ?? '',
    prazo: formulario.get('prazo') ?? '',
    visibilidade: formulario.get('visibilidade') ?? 'privada',
    valorAlvo: formulario.get('valorAlvo') ?? '',
    valorAtual: formulario.get('valorAtual') ?? '',
  }
}
