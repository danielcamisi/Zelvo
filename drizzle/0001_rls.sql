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
