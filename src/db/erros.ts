/**
 * Tradução dos erros de conexão com o Postgres.
 *
 * Sem isto, um `DATABASE_URL` com host errado vira uma requisição vermelha no
 * navegador e nada mais. A causa quase sempre está no código do erro, e cada
 * código aponta para um campo diferente da connection string — por isso a
 * mensagem diz onde olhar, e não só que "falhou".
 *
 * Nenhuma mensagem daqui pode conter a connection string nem a senha.
 */

type ErroDeBanco = { code?: unknown; cause?: unknown }

/**
 * O Drizzle embrulha o erro do driver num `DrizzleQueryError` cuja mensagem é
 * só "Failed query: select 1". O código de verdade está no `cause`, às vezes
 * dois níveis abaixo — por isso tudo aqui percorre a cadeia em vez de olhar
 * só o erro de cima.
 */
function cadeiaDeErros(erro: unknown): unknown[] {
  const cadeia: unknown[] = []
  let atual = erro
  for (let nivel = 0; nivel < 5 && atual != null; nivel += 1) {
    cadeia.push(atual)
    if (typeof atual !== 'object') break
    atual = (atual as ErroDeBanco).cause
  }
  return cadeia
}

export function ehErroDeBanco(erro: unknown): boolean {
  return codigoDeErro(erro) !== null
}

export function codigoDeErro(erro: unknown): string | null {
  for (const elo of cadeiaDeErros(erro)) {
    if (typeof elo !== 'object' || elo === null) continue
    const codigo = (elo as ErroDeBanco).code
    if (typeof codigo === 'string') return codigo
  }
  return null
}

/** Todas as mensagens da cadeia, para procurar um sintoma que não tem código. */
function mensagensDe(erro: unknown): string {
  return cadeiaDeErros(erro)
    .map((elo) => (elo instanceof Error ? elo.message : ''))
    .join(' | ')
}

export function traduzirErroDeBanco(erro: unknown): string {
  const mensagem = mensagensDe(erro)

  // O erro que nós mesmos lançamos quando a variável não existe já vem pronto.
  if (erro instanceof Error && erro.message.startsWith('DATABASE_URL não está configurada')) {
    return erro.message
  }

  switch (codigoDeErro(erro)) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'O endereço do banco não existe. Confira o host da DATABASE_URL: ele precisa ser o da Transaction pooler do Supabase, terminado em `pooler.supabase.com`.'
    case 'ECONNREFUSED':
      return 'O banco recusou a conexão. Quase sempre é a porta: a Transaction pooler usa 6543, não 5432.'
    case 'ETIMEDOUT':
    case 'CONNECT_TIMEOUT':
      return 'A conexão com o banco esgotou o tempo. Confira host e porta da DATABASE_URL (Transaction pooler, porta 6543).'
    case '28P01':
      return 'Senha do banco incorreta. Gere uma nova em Project Settings → Database → Reset database password e atualize a DATABASE_URL na Vercel. Se a senha tiver símbolos, eles precisam vir codificados na URL.'
    case '28000':
      return 'Usuário do banco recusado. Na Transaction pooler o usuário tem a forma `postgres.<ref-do-projeto>`, não só `postgres`.'
    case '3D000':
      return 'O banco indicado na DATABASE_URL não existe. No Supabase o nome é `postgres`.'
    case '42P01':
      return 'As tabelas ainda não existem neste banco. Rode o `supabase-setup.sql` no SQL Editor do Supabase.'
    case '42501':
      return 'O usuário do banco não tem permissão nesta tabela.'
    default:
      break
  }

  // O pooler em modo transação não aceita prepared statements. Se isso
  // aparecer, é porque a conexão foi criada sem `prepare: false`.
  if (/prepared statement/i.test(mensagem)) {
    return 'O pooler do Supabase não aceita prepared statements. A conexão precisa ser criada com `prepare: false`.'
  }

  return ''
}

/**
 * A mensagem mais útil da cadeia: a do erro mais profundo que tenha texto.
 * O embrulho do Drizzle só diz "Failed query"; quem explica é o driver.
 */
export function mensagemDeErro(erro: unknown, limite = 200): string {
  const mensagens = cadeiaDeErros(erro)
    .map((elo) => (elo instanceof Error ? elo.message : ''))
    .filter((texto) => texto.trim().length > 0)

  const escolhida = mensagens[mensagens.length - 1] ?? String(erro)
  return escolhida.replace(/\s+/g, ' ').slice(0, limite)
}
