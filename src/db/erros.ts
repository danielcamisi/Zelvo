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
  if (
    erro instanceof Error &&
    (erro.message.startsWith('DATABASE_URL não está configurada') ||
      erro.message.startsWith('A DATABASE_URL está usando a Direct connection') ||
      erro.message.startsWith('A DATABASE_URL está na Session pooler'))
  ) {
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

  // XX000 é o código genérico de erro interno, então quem identifica este
  // caso é a mensagem, não o código.
  if (/EMAXCONNSESSION|max clients reached in session mode/i.test(mensagem)) {
    return 'O pooler recusou: a DATABASE_URL está na Session pooler (porta 5432), onde cabem 15 clientes e cada um segura a conexão do início ao fim. Troque a porta para 6543, a Transaction pooler. Host, usuário e senha seguem iguais.'
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

/**
 * Problemas que dá para apontar só olhando a connection string, antes de
 * tentar conectar.
 *
 * O caso que motivou isto: o Supabase oferece duas strings, e a **Direct
 * connection** (`db.<ref>.supabase.co`) só tem endereço IPv6. As funções da
 * Vercel saem por IPv4, então o Node nem resolve o nome e devolve
 * `ENOTFOUND` — um erro que parece "host digitado errado" e faz procurar no
 * lugar errado por muito tempo. A string certa para serverless é a
 * **Transaction pooler**.
 *
 * Devolve `null` quando não há nada a apontar. Nunca devolve a URL.
 */
export function avaliarUrlDoBanco(url: string | undefined): string | null {
  if (!url) return null

  // Regex em vez de `new URL`: senha com caractere especial faz o parser
  // estourar, e aí o diagnóstico morre junto com o que queria diagnosticar.
  // O `[^/]*@` guloso pega o último `@` antes do host, que é o que separa
  // credencial de endereço mesmo quando a senha tem um `@` no meio.
  const partes = /^[a-z]+:\/\/(?:[^/]*@)?([^@:/?#]+)(?::(\d+))?/i.exec(url)
  const host = partes?.[1]
  const porta = partes?.[2]
  if (!host) return null

  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(host)) {
    return 'A DATABASE_URL está usando a Direct connection do Supabase (`db.<ref>.supabase.co`), que só responde em IPv6 — e as funções da Vercel saem por IPv4, então o endereço nem resolve. Troque pela string da **Transaction pooler**, em Connect no painel do Supabase: host `...pooler.supabase.com`, porta 6543, usuário `postgres.<ref>`.'
  }

  // Mesmo host, portas diferentes: 5432 é a Session pooler e 6543 é a
  // Transaction pooler. Em modo sessão cada cliente segura uma conexão do
  // banco do começo ao fim, e o limite é 15 — uma função serverless, que
  // sobe muitas instâncias, esgota isso em segundos.
  if (/\.pooler\.supabase\.com$/i.test(host) && porta === '5432') {
    return 'A DATABASE_URL está na Session pooler (porta 5432). Em modo sessão cada conexão fica presa a um cliente e o limite é 15, o que uma função serverless estoura em segundos. Troque só a porta para **6543**, que é a Transaction pooler — o host, o usuário e a senha continuam os mesmos.'
  }

  return null
}
