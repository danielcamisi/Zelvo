/* Verificação do marco 1 em navegador real.
 * Entrega um push ao service worker pelo protocolo do Chrome e confere que
 * a notificação foi criada com o título, corpo e dados certos.
 * Rodar com o `next start` já no ar: node scripts/verificar-push.mjs
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://127.0.0.1:3000'
const falhas = []
const ok = (nome) => console.log('  ok   ' + nome)
const falhou = (nome, detalhe) => { falhas.push(nome); console.log('  FALHA ' + nome + ' — ' + detalhe) }

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const contexto = await navegador.newContext({ permissions: ['notifications'] })
const pagina = await contexto.newPage()

const erros = []
pagina.on('pageerror', (e) => erros.push(String(e)))

await pagina.goto(BASE, { waitUntil: 'networkidle' })

// 1. O service worker registrou e está ativo?
const estadoSw = await pagina.evaluate(async () => {
  const r = await navigator.serviceWorker.ready
  return { escopo: r.scope, ativo: Boolean(r.active) }
})
estadoSw.ativo ? ok('service worker ativo') : falhou('service worker ativo', 'sem worker ativo')
estadoSw.escopo.endsWith('/') ? ok('escopo na raiz: ' + estadoSw.escopo) : falhou('escopo', estadoSw.escopo)

// 2. Pega o registrationId pelo CDP para poder entregar o push.
const cdp = await contexto.newCDPSession(pagina)
const registros = []
cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => registros.push(...e.registrations))
await cdp.send('ServiceWorker.enable')
await new Promise((r) => setTimeout(r, 1200))

const registro = registros.filter((r) => !r.isDeleted).pop()
if (!registro) {
  falhou('registrationId via CDP', 'nenhum registro encontrado')
} else {
  ok('registrationId obtido')

  // 3. Entrega um push com o mesmo formato que o servidor envia.
  const carga = JSON.stringify({
    titulo: '08:30 — Tomar creatina',
    corpo: 'Melhorar minha saúde · +15 XP',
    tag: 'zelvo-teste',
    url: '/lembretes',
    tarefaId: 'abc-123',
  })
  await cdp.send('ServiceWorker.deliverPushMessage', {
    origin: new URL(BASE).origin,
    registrationId: registro.registrationId,
    data: carga,
  })
  await new Promise((r) => setTimeout(r, 1500))

  // 4. A notificação existe, com o conteúdo certo?
  const notificacoes = await pagina.evaluate(async () => {
    const r = await navigator.serviceWorker.ready
    const lista = await r.getNotifications()
    return lista.map((n) => ({ title: n.title, body: n.body, tag: n.tag, data: n.data, icon: n.icon }))
  })

  if (notificacoes.length !== 1) {
    falhou('uma notificação criada', 'recebi ' + notificacoes.length)
  } else {
    const n = notificacoes[0]
    ok('uma notificação criada')
    n.title === '08:30 — Tomar creatina' ? ok('título correto') : falhou('título', n.title)
    n.body === 'Melhorar minha saúde · +15 XP' ? ok('corpo correto') : falhou('corpo', n.body)
    n.tag === 'zelvo-teste' ? ok('tag correta') : falhou('tag', n.tag)
    n.icon?.endsWith('/icons/icon-192.png') ? ok('ícone correto') : falhou('ícone', String(n.icon))
    n.data?.url === '/lembretes' ? ok('url no data') : falhou('url no data', JSON.stringify(n.data))
    n.data?.tarefaId === 'abc-123' ? ok('tarefaId no data') : falhou('tarefaId', JSON.stringify(n.data))
  }

  // 5. Push com corpo não-JSON não pode quebrar o worker.
  await cdp.send('ServiceWorker.deliverPushMessage', {
    origin: new URL(BASE).origin,
    registrationId: registro.registrationId,
    data: 'texto solto, não é json',
  })
  await new Promise((r) => setTimeout(r, 1200))
  const depois = await pagina.evaluate(async () => {
    const r = await navigator.serviceWorker.ready
    return (await r.getNotifications()).length
  })
  depois >= 1 ? ok('push não-JSON tratado sem quebrar') : falhou('push não-JSON', 'nenhuma notificação')
}

erros.length === 0 ? ok('nenhum erro de JS na página') : falhou('erros de JS', erros.join(' | '))

await navegador.close()

console.log('')
if (falhas.length) {
  console.log('FALHOU: ' + falhas.length + ' verificação(ões) — ' + falhas.join(', '))
  process.exit(1)
}
console.log('Todas as verificações passaram.')
