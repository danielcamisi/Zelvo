-- ============================================================
-- ZELVO — configuração do banco
-- Gerado por `npm run db:sql`. Não edite à mão.
--
-- Cole isto inteiro no SQL Editor do Supabase e rode uma vez.
-- É seguro rodar de novo: nada é duplicado.
-- ============================================================


-- ------------------------------------------------------------
-- migration: 0000_inicial
-- ------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "public"."categoria" AS ENUM('saude', 'fitness', 'financas', 'estudos', 'carreira', 'produtividade', 'pessoal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."dificuldade" AS ENUM('facil', 'media', 'dificil');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."evento_foco" AS ENUM('pendente', 'conclusao', 'resumo', 'cobranca');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."prioridade" AS ENUM('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."recorrencia" AS ENUM('unica', 'diaria', 'semanal', 'mensal', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."status_meta" AS ENUM('ativa', 'concluida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tipo_envio" AS ENUM('lembrete', 'resumo', 'cobranca');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."tom_foco" AS ENUM('level', 'sincero', 'agressivo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."visibilidade" AS ENUM('privada', 'publica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "adiamentos_tarefa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarefa_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"data_referencia" date NOT NULL,
	"novo_horario" timestamp with time zone NOT NULL,
	CONSTRAINT "adiamentos_tarefa_dia_unq" UNIQUE("tarefa_id","data_referencia")
);


CREATE TABLE IF NOT EXISTS "conclusoes_tarefa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tarefa_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"data_referencia" date NOT NULL,
	"concluida_em" timestamp with time zone DEFAULT now() NOT NULL,
	"xp_ganho" integer NOT NULL,
	CONSTRAINT "conclusoes_tarefa_dia_unq" UNIQUE("tarefa_id","data_referencia")
);


CREATE TABLE IF NOT EXISTS "config_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"tom_foco" "tom_foco" DEFAULT 'sincero' NOT NULL,
	"horario_resumo" time DEFAULT '07:00' NOT NULL,
	"horario_cobranca" time DEFAULT '21:00' NOT NULL,
	"notificacoes_ativas" boolean DEFAULT false NOT NULL
);


CREATE TABLE IF NOT EXISTS "envios_lembrete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tarefa_id" uuid,
	"data_referencia" date NOT NULL,
	"tipo" "tipo_envio" DEFAULT 'lembrete' NOT NULL,
	"enviado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "envios_lembrete_unq" UNIQUE("tarefa_id","data_referencia","tipo")
);


CREATE TABLE IF NOT EXISTS "inscricoes_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inscricoes_push_endpoint_unique" UNIQUE("endpoint")
);


CREATE TABLE IF NOT EXISTS "mensagens_foco" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tom" "tom_foco" NOT NULL,
	"evento" "evento_foco" NOT NULL,
	"texto" text NOT NULL
);


CREATE TABLE IF NOT EXISTS "metas" (
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


CREATE TABLE IF NOT EXISTS "progresso_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"nivel" integer DEFAULT 1 NOT NULL,
	"rank" text DEFAULT 'Iniciante' NOT NULL,
	"streak_atual" integer DEFAULT 0 NOT NULL,
	"melhor_streak" integer DEFAULT 0 NOT NULL,
	"ultimo_dia_ativo" date
);


CREATE TABLE IF NOT EXISTS "tarefas" (
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


CREATE TABLE IF NOT EXISTS "usuarios" (
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


DO $$ BEGIN
  ALTER TABLE "adiamentos_tarefa" ADD CONSTRAINT "adiamentos_tarefa_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "adiamentos_tarefa" ADD CONSTRAINT "adiamentos_tarefa_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "conclusoes_tarefa" ADD CONSTRAINT "conclusoes_tarefa_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "conclusoes_tarefa" ADD CONSTRAINT "conclusoes_tarefa_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "config_usuario" ADD CONSTRAINT "config_usuario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "envios_lembrete" ADD CONSTRAINT "envios_lembrete_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "envios_lembrete" ADD CONSTRAINT "envios_lembrete_tarefa_id_tarefas_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "inscricoes_push" ADD CONSTRAINT "inscricoes_push_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "metas" ADD CONSTRAINT "metas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "progresso_usuario" ADD CONSTRAINT "progresso_usuario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "conclusoes_usuario_data_idx" ON "conclusoes_tarefa" USING btree ("usuario_id","data_referencia");

CREATE INDEX IF NOT EXISTS "metas_usuario_status_idx" ON "metas" USING btree ("usuario_id","status");

CREATE INDEX IF NOT EXISTS "tarefas_usuario_ativa_idx" ON "tarefas" USING btree ("usuario_id","ativa");

CREATE INDEX IF NOT EXISTS "tarefas_meta_idx" ON "tarefas" USING btree ("meta_id");

-- ------------------------------------------------------------
-- migration: 0001_rls
-- ------------------------------------------------------------

-- RLS: segunda camada de proteção.
-- O acesso a dados já acontece todo no servidor, filtrando por usuário. Isto é
-- a rede embaixo: se algum dia uma query esquecer o filtro, o banco recusa.
--
-- O bloco só roda onde existe o schema `auth` (ou seja, no Supabase). Em
-- Postgres puro, como o dos testes, ele não faz nada — sem isso, ligar RLS
-- sem políticas bloquearia tudo e quebraria a suíte.

DO $$
DECLARE
  nome_tabela text;
  tabelas text[] := ARRAY[
    'usuarios', 'progresso_usuario', 'config_usuario', 'metas', 'tarefas',
    'conclusoes_tarefa', 'adiamentos_tarefa', 'inscricoes_push', 'envios_lembrete'
  ];
  coluna_dono text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE NOTICE 'Schema auth ausente: pulando RLS (isto é esperado fora do Supabase).';
    RETURN;
  END IF;

  FOREACH nome_tabela IN ARRAY tabelas LOOP
    -- `usuarios` se identifica pelo próprio id; as demais por usuario_id.
    coluna_dono := CASE WHEN nome_tabela = 'usuarios' THEN 'id' ELSE 'usuario_id' END;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', nome_tabela);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', nome_tabela || '_dono', nome_tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (%I = auth.uid()) WITH CHECK (%I = auth.uid())',
      nome_tabela || '_dono', nome_tabela, coluna_dono, coluna_dono
    );
  END LOOP;

  -- Mensagens de foco são catálogo do app: todo mundo autenticado lê, ninguém escreve.
  ALTER TABLE public.mensagens_foco ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS mensagens_foco_leitura ON public.mensagens_foco;
  CREATE POLICY mensagens_foco_leitura ON public.mensagens_foco
    FOR SELECT TO authenticated USING (true);
END $$;


-- ------------------------------------------------------------
-- mensagens de foco (catálogo)
-- ------------------------------------------------------------

INSERT INTO mensagens_foco (tom, evento, texto)
SELECT novas.tom::tom_foco, novas.evento::evento_foco, novas.texto
FROM (VALUES
  ('level', 'pendente', 'Ainda dá tempo. Uma tarefa por vez.'),
  ('level', 'pendente', 'Um passo pequeno hoje ainda é um passo.'),
  ('level', 'conclusao', 'Mais um passo concluído. Continue construindo sua consistência.'),
  ('level', 'conclusao', 'Boa. Você está construindo algo sólido, um dia de cada vez.'),
  ('level', 'resumo', 'Bom dia. Veja o que você planejou para hoje.'),
  ('level', 'cobranca', 'O dia ainda não acabou. Que tal fechar uma tarefa?'),
  ('sincero', 'pendente', 'Você definiu essa meta. Agora precisa cumprir o que planejou.'),
  ('sincero', 'pendente', 'Essa tarefa não vai se fazer sozinha.'),
  ('sincero', 'conclusao', 'Feito. Segue para a próxima.'),
  ('sincero', 'conclusao', 'Uma a menos. O resto continua te esperando.'),
  ('sincero', 'resumo', 'Isto é o que você se comprometeu a fazer hoje.'),
  ('sincero', 'cobranca', 'Você ainda tem tarefa aberta. Decide: faz ou assume que não vai fazer.'),
  ('agressivo', 'pendente', 'Você não precisa de mais uma desculpa. Precisa executar a próxima tarefa.'),
  ('agressivo', 'pendente', 'Planejar foi a parte fácil. Está na hora da parte que conta.'),
  ('agressivo', 'conclusao', 'Uma feita. Isso não é o objetivo, é o mínimo. Próxima.'),
  ('agressivo', 'conclusao', 'Bom. Agora repete amanhã, e depois de amanhã.'),
  ('agressivo', 'resumo', 'Esta é a lista. Nenhuma delas se resolve sozinha.'),
  ('agressivo', 'cobranca', 'O dia está acabando e a tarefa continua aberta. Isso é escolha sua.')
) AS novas(tom, evento, texto)
WHERE NOT EXISTS (SELECT 1 FROM mensagens_foco m WHERE m.texto = novas.texto);


-- ------------------------------------------------------------
-- controle de migrations do Drizzle
-- ------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '35db9d3650f6b9834f26fe4b59392eebfeed3bbb06e7ba53bc8be877997b84d4', 1789990246567
WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '35db9d3650f6b9834f26fe4b59392eebfeed3bbb06e7ba53bc8be877997b84d4');

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT 'bb4110a22a45d8cdc37eeaf998764ff7079b0c8bfa6e8d6f04e7cfdfd53c99fa', 1789990247567
WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'bb4110a22a45d8cdc37eeaf998764ff7079b0c8bfa6e8d6f04e7cfdfd53c99fa');
