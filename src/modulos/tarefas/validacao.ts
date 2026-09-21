import { z } from 'zod'

import { ehDataISO } from '@/regras/datas'
import { xpDaTarefa } from '@/regras/xp'
import { dataObrigatoria, dataOpcional } from '@/modulos/metas/validacao'

/**
 * Regras de entrada de uma tarefa.
 *
 * O grosso daqui é sobre recorrência, porque é o campo que muda de
 * significado conforme o tipo: em 'semanal' os dias são 1..7, em 'mensal'
 * são 1..31, e em 'unica' não existem. Validar isso na entrada evita linha
 * incoerente no banco, que depois vira tarefa que nunca aparece.
 */

const PRIORIDADES = ['baixa', 'media', 'alta', 'critica'] as const
const RECORRENCIAS = ['unica', 'diaria', 'semanal', 'mensal', 'anual'] as const

const horario = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : valor))
  .refine(
    (valor) => valor === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(valor),
    'Horário inválido. Use HH:MM.',
  )

/** Checkboxes chegam como lista de strings; sem nenhuma marcada, some. */
const diasSelecionados = z
  .array(z.coerce.number().int())
  .default([])
  .transform((dias) => Array.from(new Set(dias)).sort((a, b) => a - b))

export const esquemaTarefa = z
  .object({
    titulo: z.string().trim().min(2, 'Dê um título à tarefa.').max(80, 'Título muito longo.'),
    descricao: z
      .string()
      .trim()
      .max(500, 'Descrição muito longa.')
      .transform((valor) => (valor === '' ? null : valor)),
    horario,
    recorrencia: z.enum(RECORRENCIAS, { message: 'Escolha a repetição.' }),
    recorrenciaDias: diasSelecionados,
    dataUnica: dataOpcional,
    inicioEm: dataObrigatoria,
    fimEm: dataOpcional,
    prioridade: z.enum(PRIORIDADES, { message: 'Escolha uma prioridade.' }),
    xp: z
      .string()
      .trim()
      .transform((valor) => (valor === '' ? null : Number(valor)))
      .refine(
        (valor) => valor === null || (Number.isFinite(valor) && valor >= 0 && valor <= 500),
        'O XP manual precisa ficar entre 0 e 500.',
      ),
  })
  .superRefine((dados, contexto) => {
    const erro = (path: string, message: string) =>
      contexto.addIssue({ code: 'custom', path: [path], message })

    if (dados.fimEm && dados.fimEm < dados.inicioEm) {
      erro('fimEm', 'O fim não pode ser antes do início.')
    }

    switch (dados.recorrencia) {
      case 'unica':
        if (!dados.dataUnica) erro('dataUnica', 'Escolha o dia da tarefa.')
        break

      case 'semanal':
        if (dados.recorrenciaDias.length === 0) {
          erro('recorrenciaDias', 'Marque pelo menos um dia da semana.')
        } else if (dados.recorrenciaDias.some((dia) => dia < 1 || dia > 7)) {
          erro('recorrenciaDias', 'Dia da semana inválido.')
        }
        break

      case 'mensal':
        if (dados.recorrenciaDias.length === 0) {
          erro('recorrenciaDias', 'Escolha pelo menos um dia do mês.')
        } else if (dados.recorrenciaDias.some((dia) => dia < 1 || dia > 31)) {
          erro('recorrenciaDias', 'Dia do mês precisa ficar entre 1 e 31.')
        }
        break

      case 'anual':
        if (!dados.dataUnica) erro('dataUnica', 'Escolha o dia do ano.')
        break

      default:
        break
    }
  })
  .transform(normalizar)

/**
 * Deixa a linha coerente com o que `regras/recorrencia` espera.
 *
 * O ponto que importa: `ocorreEm` ignora qualquer dia anterior a `inicioEm`.
 * Uma tarefa única marcada para antes da data de início simplesmente nunca
 * apareceria — por isso o início acompanha o dia escolhido.
 */
function normalizar(dados: z.infer<typeof esquemaBase>) {
  const semDias = dados.recorrencia === 'unica' || dados.recorrencia === 'diaria' || dados.recorrencia === 'anual'
  const dataUnica = dados.recorrencia === 'unica' || dados.recorrencia === 'anual' ? dados.dataUnica : null

  return {
    ...dados,
    recorrenciaDias: semDias ? null : dados.recorrenciaDias,
    dataUnica,
    inicioEm: dataUnica && dataUnica < dados.inicioEm ? dataUnica : dados.inicioEm,
    xpFinal: xpDaTarefa(dados.prioridade, dados.xp),
  }
}

/** Só para tipar `normalizar` sem duplicar a lista de campos. */
const esquemaBase = z.object({
  titulo: z.string(),
  descricao: z.string().nullable(),
  horario: z.string().nullable(),
  recorrencia: z.enum(RECORRENCIAS),
  recorrenciaDias: z.array(z.number()),
  dataUnica: z.string().nullable(),
  inicioEm: z.string(),
  fimEm: z.string().nullable(),
  prioridade: z.enum(PRIORIDADES),
  xp: z.number().nullable(),
})

export type DadosTarefa = z.infer<typeof esquemaTarefa>

export function lerFormularioDeTarefa(formulario: FormData) {
  return {
    titulo: formulario.get('titulo') ?? '',
    descricao: formulario.get('descricao') ?? '',
    horario: formulario.get('horario') ?? '',
    recorrencia: formulario.get('recorrencia') ?? 'unica',
    recorrenciaDias: formulario.getAll('recorrenciaDias'),
    dataUnica: formulario.get('dataUnica') ?? '',
    inicioEm: formulario.get('inicioEm') ?? '',
    fimEm: formulario.get('fimEm') ?? '',
    prioridade: formulario.get('prioridade') ?? 'media',
    xp: formulario.get('xp') ?? '',
  }
}

/** Resumo legível da repetição, para a lista de tarefas. */
export function descreverRecorrencia(tarefa: {
  recorrencia: string
  recorrenciaDias?: number[] | null
  dataUnica?: string | null
}): string {
  const nomes = ['', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

  switch (tarefa.recorrencia) {
    case 'diaria':
      return 'Todo dia'
    case 'semanal': {
      const dias = tarefa.recorrenciaDias ?? []
      if (dias.length === 7) return 'Todo dia'
      return dias.length ? dias.map((dia) => nomes[dia] ?? '').join(', ') : 'Toda semana'
    }
    case 'mensal': {
      const dias = tarefa.recorrenciaDias ?? []
      return dias.length ? `Todo mês, dia ${dias.join(', ')}` : 'Todo mês'
    }
    case 'anual':
      return 'Uma vez por ano'
    default:
      return 'Uma vez'
  }
}
