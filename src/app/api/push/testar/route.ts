import { NextResponse } from 'next/server'
import webpush, { type PushSubscription } from 'web-push'

// web-push usa crypto do Node: não roda no runtime edge.
export const runtime = 'nodejs'

function configurar() {
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  const assunto = process.env.VAPID_SUBJECT

  if (!publica || !privada || !assunto) {
    throw new Error(
      'Faltam variáveis VAPID. Rode `npm run gerar-vapid` e preencha NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT.',
    )
  }
  webpush.setVapidDetails(assunto, publica, privada)
}

function ehInscricaoValida(valor: unknown): valor is PushSubscription {
  if (typeof valor !== 'object' || valor === null) return false
  const candidato = valor as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  return (
    typeof candidato.endpoint === 'string' &&
    candidato.endpoint.startsWith('https://') &&
    typeof candidato.keys?.p256dh === 'string' &&
    typeof candidato.keys?.auth === 'string'
  )
}

/* Endpoint temporário do marco 1: recebe a inscrição do próprio cliente e
 * dispara um push para ela. Nada é gravado ainda. No passo 9 isso vira
 * /api/push/inscrever + o dispatcher do cron lendo do banco. */
export async function POST(requisicao: Request) {
  try {
    configurar()

    const corpo: unknown = await requisicao.json()
    const inscricao = (corpo as { inscricao?: unknown })?.inscricao

    if (!ehInscricaoValida(inscricao)) {
      return NextResponse.json({ erro: 'Inscrição inválida ou ausente.' }, { status: 400 })
    }

    await webpush.sendNotification(
      inscricao,
      JSON.stringify({
        titulo: '08:30 — Tomar creatina',
        corpo: 'Melhorar minha saúde · +15 XP',
        tag: 'zelvo-teste',
        url: '/',
      }),
    )

    return NextResponse.json({ ok: true })
  } catch (erro) {
    const detalhes = erro as { statusCode?: number; body?: string; message?: string }
    const status = Number(detalhes?.statusCode) || 500

    // A mensagem crua do web-push ("Received unexpected response code") não ajuda
    // ninguém a consertar nada. Traduz para o que de fato costuma estar errado.
    let mensagem: string
    if (status === 404 || status === 410) {
      mensagem =
        'A inscrição expirou ou foi revogada. Remova o app da tela de início, adicione de novo e ative os lembretes.'
    } else if (status === 403) {
      mensagem =
        'O serviço de push recusou a assinatura (403). Normalmente é chave VAPID trocada depois da inscrição, ou VAPID_SUBJECT inválido. Gere as chaves uma vez só e reinscreva o app.'
    } else if (status === 413) {
      mensagem = 'A mensagem do push é grande demais (413). Encurte o título e o corpo.'
    } else if (status === 429) {
      mensagem = 'O serviço de push pediu para desacelerar (429). Tente de novo em instantes.'
    } else {
      mensagem = detalhes?.message ?? 'Falha desconhecida ao enviar o push.'
    }

    return NextResponse.json(
      {
        erro: mensagem,
        // Ajuda a depurar sem precisar abrir o log do servidor.
        diagnostico: { status, resposta: detalhes?.body?.slice(0, 300) ?? null },
      },
      { status: status >= 400 && status < 600 ? status : 500 },
    )
  }
}
