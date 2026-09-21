'use client'

import { useCallback, useEffect, useState } from 'react'

import Aviso from './Aviso'

type Estado = {
  instalado: boolean
  temServiceWorker: boolean
  temPush: boolean
  temNotificacao: boolean
  permissao: NotificationPermission | 'indisponivel'
  inscrito: boolean
  endpoint: string | null
}

const ESTADO_INICIAL: Estado = {
  instalado: false,
  temServiceWorker: false,
  temPush: false,
  temNotificacao: false,
  permissao: 'indisponivel',
  inscrito: false,
  endpoint: null,
}

/** A chave pública VAPID vem em base64url e o navegador exige bytes. */
function base64UrlParaBytes(base64Url: string): Uint8Array {
  const preenchimento = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + preenchimento).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(base64)
  const bytes = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  const comoApp = window.matchMedia('(display-mode: standalone)').matches
  // Safari no iOS não implementa display-mode, usa esta propriedade própria.
  const safariIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return comoApp || safariIOS
}

export default function PainelPush() {
  const [estado, setEstado] = useState<Estado>(ESTADO_INICIAL)
  const [ocupado, setOcupado] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const lerEstado = useCallback(async () => {
    const temServiceWorker = 'serviceWorker' in navigator
    const temPush = 'PushManager' in window
    const temNotificacao = 'Notification' in window

    let inscrito = false
    let endpoint: string | null = null

    if (temServiceWorker && temPush) {
      try {
        const registro = await navigator.serviceWorker.getRegistration()
        const inscricao = await registro?.pushManager.getSubscription()
        inscrito = Boolean(inscricao)
        endpoint = inscricao?.endpoint ?? null
      } catch {
        // Sem registro ainda: segue com os valores padrão.
      }
    }

    setEstado({
      instalado: estaInstalado(),
      temServiceWorker,
      temPush,
      temNotificacao,
      permissao: temNotificacao ? Notification.permission : 'indisponivel',
      inscrito,
      endpoint,
    })
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      void lerEstado()
      return
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(() => lerEstado())
      .catch((erro: unknown) => {
        setMensagem({ tipo: 'erro', texto: `Falha ao registrar o service worker: ${String(erro)}` })
        void lerEstado()
      })
  }, [lerEstado])

  async function ativar() {
    setOcupado(true)
    setMensagem(null)
    try {
      const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!chavePublica) {
        throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não está configurada no servidor.')
      }

      // O iOS exige que isto aconteça dentro do clique. Nada de pedir no load.
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        throw new Error(
          permissao === 'denied'
            ? 'Permissão negada. Remova o app da tela de início, adicione novamente e autorize quando o iPhone perguntar.'
            : 'Permissão não concedida.',
        )
      }

      const registro = await navigator.serviceWorker.ready
      const existente = await registro.pushManager.getSubscription()
      const inscricao =
        existente ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlParaBytes(chavePublica) as BufferSource,
        }))

      setMensagem({ tipo: 'ok', texto: 'Notificações autorizadas. Envie a notificação de teste para confirmar.' })
      void inscricao
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : String(erro) })
    } finally {
      setOcupado(false)
      await lerEstado()
    }
  }

  async function testar() {
    setOcupado(true)
    setMensagem(null)
    try {
      const registro = await navigator.serviceWorker.ready
      const inscricao = await registro.pushManager.getSubscription()
      if (!inscricao) throw new Error('Nenhuma inscrição ativa. Toque em Ativar notificações primeiro.')

      const resposta = await fetch('/api/push/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscricao }),
      })
      const corpo: { erro?: string } = await resposta.json()
      if (!resposta.ok) throw new Error(corpo.erro ?? `O servidor respondeu ${resposta.status}.`)

      setMensagem({
        tipo: 'ok',
        texto: 'Notificação enviada. Bloqueie a tela do iPhone e aguarde alguns segundos.',
      })
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : String(erro) })
    } finally {
      setOcupado(false)
    }
  }

  const podeUsarPush = estado.temPush && estado.temNotificacao && estado.temServiceWorker

  return (
    <div className="flex flex-col gap-4">
      {!estado.instalado && (
        <section className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5">
          <h3 className="text-[15px] font-semibold">Instale o app na tela de início</h3>
          <p className="text-[13px] leading-relaxed text-suave">
            No iPhone, a notificação só funciona com o app instalado. Em uma aba do Safari o
            recurso não existe.
          </p>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[13px] leading-relaxed text-texto marker:text-tenue">
            <li>Abra esta página no <strong className="font-semibold">Safari</strong>. O Chrome do iPhone não serve.</li>
            <li>Toque em <strong className="font-semibold">Compartilhar</strong>, o quadrado com a seta para cima.</li>
            <li>Escolha <strong className="font-semibold">Adicionar à Tela de Início</strong>.</li>
            <li>Abra o Zelvo pelo <strong className="font-semibold">ícone novo</strong> e volte a esta tela.</li>
          </ol>
        </section>
      )}

      {estado.instalado && !podeUsarPush && (
        <Aviso tipo="informacao" titulo="Notificações indisponíveis neste aparelho">
          O app está instalado, mas este iPhone não expõe a API de push. Verifique se o iOS está
          na versão 16.4 ou mais recente.
        </Aviso>
      )}

      {estado.instalado && podeUsarPush && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={ativar}
            disabled={ocupado || estado.permissao === 'granted'}
            className="h-13 rounded-2xl bg-acento text-[15px] font-semibold text-fundo transition active:scale-[0.99] disabled:bg-superficie-2 disabled:text-suave"
          >
            {estado.permissao === 'granted' ? 'Notificações ativadas' : 'Ativar notificações'}
          </button>

          <button
            type="button"
            onClick={testar}
            disabled={ocupado || !estado.inscrito}
            className="h-13 rounded-2xl border border-borda text-[15px] font-medium text-texto transition active:bg-superficie-2 disabled:text-tenue"
          >
            Enviar notificação de teste
          </button>
        </section>
      )}

      {mensagem && (
        <Aviso
          tipo={mensagem.tipo === 'ok' ? 'sucesso' : 'erro'}
          titulo={mensagem.tipo === 'ok' ? 'Pronto' : undefined}
        >
          {mensagem.texto}
        </Aviso>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5">
        <h3 className="text-xs font-semibold tracking-[0.12em] text-tenue uppercase">
          Diagnóstico
        </h3>
        <dl className="flex flex-col">
          <Linha rotulo="Instalado na tela de início" valor={estado.instalado} />
          <Linha rotulo="Service Worker" valor={estado.temServiceWorker} />
          <Linha rotulo="Push API" valor={estado.temPush} />
          <Linha rotulo="Notification API" valor={estado.temNotificacao} />
          <Linha rotulo="Permissão" valor={estado.permissao} />
          <Linha rotulo="Inscrito" valor={estado.inscrito} />
        </dl>
        {estado.endpoint && (
          <p className="text-[11px] break-all text-tenue">
            Endpoint: {estado.endpoint.slice(0, 60)}…
          </p>
        )}
        <p className="text-[12px] leading-relaxed text-tenue">
          Se algo falhar, envie esta lista. Ela indica exatamente onde o processo parou.
        </p>
      </section>
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: boolean | string }) {
  const texto = typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : valor
  return (
    <div className="flex items-center justify-between gap-3 border-b border-borda/70 py-2.5 text-[13px] last:border-b-0">
      <dt className="text-suave">{rotulo}</dt>
      <dd className="font-medium text-texto">{texto}</dd>
    </div>
  )
}
