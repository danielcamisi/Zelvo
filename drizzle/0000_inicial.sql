CREATE TYPE "public"."categoria" AS ENUM('saude', 'fitness', 'financas', 'estudos', 'carreira', 'produtividade', 'pessoal');--> statement-breakpoint
CREATE TYPE "public"."dificuldade" AS ENUM('facil', 'media', 'dificil');--> statement-breakpoint
CREATE TYPE "public"."evento_foco" AS ENUM('pendente', 'conclusao', 'resumo', 'cobranca');--> statement-breakpoint
CREATE TYPE "public"."prioridade" AS ENUM('baixa', 'media', 'alta', 'critica');--> statement-breakpoint
CREATE TYPE "public"."recorrencia" AS ENUM('unica', 'diaria', 'semanal', 'mensal', 'anual');--> statement-breakpoint
CREATE TYPE "public"."status_meta" AS ENUM('ativa', 'concluida', 'arquivada');--> statement-breakpoint
CREATE TYPE "public"."tipo_envio" AS ENUM('lembrete', 'resumo', 'cobranca');--> statement-breakpoint
CREATE TYPE "public"."tom_foco" AS ENUM('level', 'sincero', 'agressivo');--> statement-breakpoint
CREATE TYPE "public"."visibilidade" AS ENUM('privada', 'publica');--> statement-breakpoint
CREATE TABLE "adiamentos_tarefa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarefa_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"data_referencia" date NOT NULL,
	"novo_horario" timestamp with time zone NOT NULL,
	CONSTRAINT "adiamentos_tarefa_dia_unq" UNIQUE("tarefa_id","data_referencia")
);
--> statement-breakpoint
CREATE TABLE "conclusoes_tarefa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarefa_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"data_referencia" date NOT NULL,
	"concluida_em" timestamp with time zone DEFAULT now() NOT NULL,
	"xp_ganho" integer NOT NULL,
	CONSTRAINT "conclusoes_tarefa_dia_unq" UNIQUE("tarefa_id","data_referencia")
);
--> statement-breakpoint
CREATE TABLE "config_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"tom_foco" "tom_foco" DEFAULT 'sincero' NOT NULL,
	"horario_resumo" time DEFAULT '07:00' NOT NULL,
	"horario_cobranca" time DEFAULT '21:00' NOT NULL,
	"notificacoes_ativas" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "envios_lembrete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tarefa_id" uuid,
	"data_referencia" date NOT NULL,
	"tipo" "tipo_envio" DEFAULT 'lembrete' NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "envios_lembrete_unq" UNIQUE("tarefa_id","data_referencia","tipo")
);
--> statement-breakpoint
CREATE TABLE "inscricoes_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inscricoes_push_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "mensagens_foco" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tom" "tom_foco" NOT NULL,
	"evento" "evento_foco" NOT NULL,
	"texto" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"categoria" "categoria" NOT NULL,
	"prioridade" "prioridade" DEFAULT 'media' NOT NULL,
	"dificuldade" "dificuldade" DEFAULT 'media' NOT NULL,
	"data_inicio" date NOT NULL,
	"prazo" date,
	"status" "status_meta" DEFAULT 'ativa' NOT NULL,
	"xp_recompensa" integer NOT NULL,
	"visibilidade" "visibilidade" DEFAULT 'privada' NOT NULL,
	"valor_alvo" numeric(12, 2),
	"valor_atual" numeric(12, 2),
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progresso_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"nivel" integer DEFAULT 1 NOT NULL,
	"rank" text DEFAULT 'Iniciante' NOT NULL,
	"streak_atual" integer DEFAULT 0 NOT NULL,
	"melhor_streak" integer DEFAULT 0 NOT NULL,
	"ultimo_dia_ativo" date
);
--> statement-breakpoint
CREATE TABLE "tarefas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_id" uuid,
	"usuario_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"horario" time,
	"recorrencia" "recorrencia" DEFAULT 'unica' NOT NULL,
	"recorrencia_dias" integer[],
	"data_unica" date,
	"inicio_em" date NOT NULL,
	"fim_em" date,
	"prioridade" "prioridade" DEFAULT 'media' NOT NULL,
	"xp" integer NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email"),
	CONSTRAINT "usuarios_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "adiamentos_tarefa" ADD CONSTRAINT "adiamentos_tarefa_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adiamentos_tarefa" ADD CONSTRAINT "adiamentos_tarefa_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conclusoes_tarefa" ADD CONSTRAINT "conclusoes_tarefa_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conclusoes_tarefa" ADD CONSTRAINT "conclusoes_tarefa_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_usuario" ADD CONSTRAINT "config_usuario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_lembrete" ADD CONSTRAINT "envios_lembrete_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_lembrete" ADD CONSTRAINT "envios_lembrete_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricoes_push" ADD CONSTRAINT "inscricoes_push_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas" ADD CONSTRAINT "metas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progresso_usuario" ADD CONSTRAINT "progresso_usuario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conclusoes_usuario_data_idx" ON "conclusoes_tarefa" USING btree ("usuario_id","data_referencia");--> statement-breakpoint
CREATE INDEX "metas_usuario_status_idx" ON "metas" USING btree ("usuario_id","status");--> statement-breakpoint
CREATE INDEX "tarefas_usuario_ativa_idx" ON "tarefas" USING btree ("usuario_id","ativa");--> statement-breakpoint
CREATE INDEX "tarefas_meta_idx" ON "tarefas" USING btree ("meta_id");