-- Bucket das fotos de perfil, aplicado no Supabase em 21/09/2026.
--
-- Fica fora do Drizzle de propósito: `storage.objects` é uma tabela do
-- Supabase, não do schema do Zelvo, e uma migration do Drizzle tentaria
-- recriá-la no Postgres dos testes, onde esse schema não existe.
--
-- Leitura pública (a foto precisa abrir no app sem token) e escrita só do
-- dono, identificado pela primeira pasta do caminho: <uid>/avatar.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatares_leitura_publica'
  ) then
    create policy "avatares_leitura_publica"
      on storage.objects for select
      using (bucket_id = 'avatares');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatares_dono_envia'
  ) then
    create policy "avatares_dono_envia"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatares_dono_atualiza'
  ) then
    create policy "avatares_dono_atualiza"
      on storage.objects for update to authenticated
      using (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatares_dono_apaga'
  ) then
    create policy "avatares_dono_apaga"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
