/**
 * Schema do Zelvo.
 *
 * Duas decisões estruturais que valem mais que o resto deste arquivo:
 *
 * 1. Tarefa recorrente NÃO tem campo de status. "Tomar creatina" não é
 *    concluída uma vez — é concluída em 21/09, em 22/09, em 23/09. Por isso
 *    a conclusão vive em `conclusoesTarefa`, com uma `dataReferencia`, e a
 *    UNIQUE nessa dupla é o que impede conclusão duplicada no mesmo dia.
 *    Streak, progresso e histórico saem todos dessa tabela.
 *
 * 2. Público e privado são separados na estrutura, não num campo solto.
 *    Só o que está em `perfisPublicos` (a view do passo 11) pode ser visto por
 *    outra pessoa. Valor financeiro nunca sai, nem em meta marcada como pública.
 */
import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ enums */

export const categoriaEnum = pgEnum('categoria', [
  'saude',
  'fitness',
  'financas',
  'estudos',
  'carreira',
  'produtividade',
  'pessoal',
])

export const prioridadeEnum = pgEnum('prioridade', ['baixa', 'media', 'alta', 'critica'])
export const dificuldadeEnum = pgEnum('dificuldade', ['facil', 'media', 'dificil'])
export const statusMetaEnum = pgEnum('status_meta', ['ativa', 'concluida', 'arquivada'])
export const visibilidadeEnum = pgEnum('visibilidade', ['privada', 'publica'])
export const recorrenciaEnum = pgEnum('recorrencia', [
  'unica',
  'diaria',
  'semanal',
  'mensal',
  'anual',
])
export const tomFocoEnum = pgEnum('tom_foco', ['level', 'sincero', 'agressivo'])
export const eventoFocoEnum = pgEnum('evento_foco', [
  'pendente',
  'conclusao',
  'resumo',
  'cobranca',
])
export const tipoEnvioEnum = pgEnum('tipo_envio', ['lembrete', 'resumo', 'cobranca'])

/* -------------------------------------------------------------- usuários */

/** Espelha `auth.users` do Supabase. O id é o mesmo. */
export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  username: text('username').notNull().unique(),
  avatarUrl: text('avatar_url'),
  /** Todo cálculo de data passa por aqui. O servidor roda em UTC. */
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})

export const progressoUsuario = pgTable('progresso_usuario', {
  usuarioId: uuid('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  xpTotal: integer('xp_total').notNull().default(0),
  nivel: integer('nivel').notNull().default(1),
  rank: text('rank').notNull().default('Iniciante'),
  streakAtual: integer('streak_atual').notNull().default(0),
  melhorStreak: integer('melhor_streak').notNull().default(0),
  ultimoDiaAtivo: date('ultimo_dia_ativo'),
})

export const configUsuario = pgTable('config_usuario', {
  usuarioId: uuid('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tomFoco: tomFocoEnum('tom_foco').notNull().default('sincero'),
  horarioResumo: time('horario_resumo').notNull().default('07:00'),
  horarioCobranca: time('horario_cobranca').notNull().default('21:00'),
  notificacoesAtivas: boolean('notificacoes_ativas').notNull().default(false),
})

/* ----------------------------------------------------------------- metas */

export const metas = pgTable(
  'metas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    descricao: text('descricao'),
    categoria: categoriaEnum('categoria').notNull(),
    prioridade: prioridadeEnum('prioridade').notNull().default('media'),
    dificuldade: dificuldadeEnum('dificuldade').notNull().default('media'),
    dataInicio: date('data_inicio').notNull(),
    prazo: date('prazo'),
    status: statusMetaEnum('status').notNull().default('ativa'),
    xpRecompensa: integer('xp_recompensa').notNull(),
    /** Nasce privada. Sempre. */
    visibilidade: visibilidadeEnum('visibilidade').notNull().default('privada'),
    /** Só metas financeiras usam estes dois. Nunca são públicos. */
    valorAlvo: numeric('valor_alvo', { precision: 12, scale: 2 }),
    valorAtual: numeric('valor_atual', { precision: 12, scale: 2 }),
    criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (tabela) => [index('metas_usuario_status_idx').on(tabela.usuarioId, tabela.status)],
)

/* --------------------------------------------------------------- tarefas */

export const tarefas = pgTable(
  'tarefas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Tarefa solta, sem meta, é permitida. */
    metaId: uuid('meta_id').references(() => metas.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    descricao: text('descricao'),
    /** Sem horário, a tarefa aparece no dia mas não dispara lembrete. */
    horario: time('horario'),
    recorrencia: recorrenciaEnum('recorrencia').notNull().default('unica'),
    /**
     * semanal: dias da semana, 1 = segunda … 7 = domingo.
     * mensal: dias do mês, 1..31.
     * unica: a data vive em `dataUnica`.
     */
    recorrenciaDias: integer('recorrencia_dias').array(),
    dataUnica: date('data_unica'),
    /** A partir de quando a tarefa vale. Default: a criação. */
    inicioEm: date('inicio_em').notNull(),
    /** Até quando vale. Nulo = sem fim. */
    fimEm: date('fim_em'),
    prioridade: prioridadeEnum('prioridade').notNull().default('media'),
    xp: integer('xp').notNull(),
    ativa: boolean('ativa').notNull().default(true),
    criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (tabela) => [
    index('tarefas_usuario_ativa_idx').on(tabela.usuarioId, tabela.ativa),
    index('tarefas_meta_idx').on(tabela.metaId),
  ],
)

/* ------------------------------------------------------------- conclusões */

export const conclusoesTarefa = pgTable(
  'conclusoes_tarefa',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tarefaId: uuid('tarefa_id')
      .notNull()
      .references(() => tarefas.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    /** O dia a que a conclusão se refere, no fuso do usuário. */
    dataReferencia: date('data_referencia').notNull(),
    concluidaEm: timestamp('concluida_em', { withTimezone: true }).notNull().defaultNow(),
    xpGanho: integer('xp_ganho').notNull(),
  },
  (tabela) => [
    // O coração da recorrência: uma conclusão por tarefa por dia.
    unique('conclusoes_tarefa_dia_unq').on(tabela.tarefaId, tabela.dataReferencia),
    index('conclusoes_usuario_data_idx').on(tabela.usuarioId, tabela.dataReferencia),
  ],
)

export const adiamentosTarefa = pgTable(
  'adiamentos_tarefa',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tarefaId: uuid('tarefa_id')
      .notNull()
      .references(() => tarefas.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    dataReferencia: date('data_referencia').notNull(),
    novoHorario: timestamp('novo_horario', { withTimezone: true }).notNull(),
  },
  (tabela) => [unique('adiamentos_tarefa_dia_unq').on(tabela.tarefaId, tabela.dataReferencia)],
)

/* ----------------------------------------------------------- notificações */

export const inscricoesPush = pgTable('inscricoes_push', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  criadaEm: timestamp('criada_em', { withTimezone: true }).notNull().defaultNow(),
})

/** Idempotência do cron: ele pode rodar duas vezes, o push não pode sair duas vezes. */
export const enviosLembrete = pgTable(
  'envios_lembrete',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    tarefaId: uuid('tarefa_id').references(() => tarefas.id, { onDelete: 'cascade' }),
    dataReferencia: date('data_referencia').notNull(),
    tipo: tipoEnvioEnum('tipo').notNull().default('lembrete'),
    enviadoEm: timestamp('enviado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (tabela) => [
    unique('envios_lembrete_unq').on(tabela.tarefaId, tabela.dataReferencia, tabela.tipo),
  ],
)

export const mensagensFoco = pgTable('mensagens_foco', {
  id: uuid('id').primaryKey().defaultRandom(),
  tom: tomFocoEnum('tom').notNull(),
  evento: eventoFocoEnum('evento').notNull(),
  texto: text('texto').notNull(),
})

/* ------------------------------------------------------------- relations */

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  progresso: one(progressoUsuario),
  config: one(configUsuario),
  metas: many(metas),
  tarefas: many(tarefas),
}))

export const metasRelations = relations(metas, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [metas.usuarioId], references: [usuarios.id] }),
  tarefas: many(tarefas),
}))

export const tarefasRelations = relations(tarefas, ({ one, many }) => ({
  meta: one(metas, { fields: [tarefas.metaId], references: [metas.id] }),
  usuario: one(usuarios, { fields: [tarefas.usuarioId], references: [usuarios.id] }),
  conclusoes: many(conclusoesTarefa),
}))

export const conclusoesTarefaRelations = relations(conclusoesTarefa, ({ one }) => ({
  tarefa: one(tarefas, { fields: [conclusoesTarefa.tarefaId], references: [tarefas.id] }),
}))

/* ----------------------------------------------------------------- tipos */

export type Usuario = typeof usuarios.$inferSelect
export type Meta = typeof metas.$inferSelect
export type NovaMeta = typeof metas.$inferInsert
export type Tarefa = typeof tarefas.$inferSelect
export type NovaTarefa = typeof tarefas.$inferInsert
export type ConclusaoTarefa = typeof conclusoesTarefa.$inferSelect
export type ProgressoUsuario = typeof progressoUsuario.$inferSelect
export type ConfigUsuario = typeof configUsuario.$inferSelect
