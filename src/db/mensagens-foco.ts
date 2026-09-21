import type { mensagensFoco } from './schema'

export type MensagemSemente = typeof mensagensFoco.$inferInsert

/**
 * Regra dura do tom AGRESSIVO: é linguagem de cobrança, nunca humilhação,
 * ameaça, xingamento ou ataque pessoal. Se uma frase nova não passar nesse
 * teste, ela não entra.
 */
export const MENSAGENS: MensagemSemente[] = [
  // ---------------------------------------------------------------- level
  { tom: 'level', evento: 'pendente', texto: 'Ainda dá tempo. Uma tarefa por vez.' },
  { tom: 'level', evento: 'pendente', texto: 'Um passo pequeno hoje ainda é um passo.' },
  { tom: 'level', evento: 'conclusao', texto: 'Mais um passo concluído. Continue construindo sua consistência.' },
  { tom: 'level', evento: 'conclusao', texto: 'Boa. Você está construindo algo sólido, um dia de cada vez.' },
  { tom: 'level', evento: 'resumo', texto: 'Bom dia. Veja o que você planejou para hoje.' },
  { tom: 'level', evento: 'cobranca', texto: 'O dia ainda não acabou. Que tal fechar uma tarefa?' },

  // -------------------------------------------------------------- sincero
  { tom: 'sincero', evento: 'pendente', texto: 'Você definiu essa meta. Agora precisa cumprir o que planejou.' },
  { tom: 'sincero', evento: 'pendente', texto: 'Essa tarefa não vai se fazer sozinha.' },
  { tom: 'sincero', evento: 'conclusao', texto: 'Feito. Segue para a próxima.' },
  { tom: 'sincero', evento: 'conclusao', texto: 'Uma a menos. O resto continua te esperando.' },
  { tom: 'sincero', evento: 'resumo', texto: 'Isto é o que você se comprometeu a fazer hoje.' },
  { tom: 'sincero', evento: 'cobranca', texto: 'Você ainda tem tarefa aberta. Decide: faz ou assume que não vai fazer.' },

  // ------------------------------------------------------------ agressivo
  { tom: 'agressivo', evento: 'pendente', texto: 'Você não precisa de mais uma desculpa. Precisa executar a próxima tarefa.' },
  { tom: 'agressivo', evento: 'pendente', texto: 'Planejar foi a parte fácil. Está na hora da parte que conta.' },
  { tom: 'agressivo', evento: 'conclusao', texto: 'Uma feita. Isso não é o objetivo, é o mínimo. Próxima.' },
  { tom: 'agressivo', evento: 'conclusao', texto: 'Bom. Agora repete amanhã, e depois de amanhã.' },
  { tom: 'agressivo', evento: 'resumo', texto: 'Esta é a lista. Nenhuma delas se resolve sozinha.' },
  { tom: 'agressivo', evento: 'cobranca', texto: 'O dia está acabando e a tarefa continua aberta. Isso é escolha sua.' },
]
