/**
 * As duas variáveis públicas do Supabase.
 *
 * A anon key é pública por desenho: ela só identifica o projeto, e quem
 * protege os dados é a RLS. O que nunca pode vir para cá é a
 * `SUPABASE_SERVICE_ROLE_KEY` nem a `DATABASE_URL`.
 */
export function configSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Configure as duas na Vercel (Settings → Environment Variables, marcando Production e Preview) ' +
        'e faça um novo deploy: variável nova só entra em build novo.',
    )
  }

  return { url, anonKey }
}
