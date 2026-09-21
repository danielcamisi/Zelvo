'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import Avatar from './Avatar'
import Aviso from './Aviso'
import { clienteNavegador } from '@/modulos/auth/supabase-navegador'
import { BUCKET_AVATARES, caminhoDoAvatar } from '@/modulos/perfil/avatar'
import { salvarAvatar } from '@/modulos/perfil/acoes'

/**
 * Foto de perfil: escolher, cortar no quadrado e enviar.
 *
 * O arquivo é reduzido no próprio aparelho antes de subir. Foto de iPhone
 * passa de 3 MB, e mandar isso para um avatar de 44px gastaria a franquia do
 * Storage e a paciência de quem está no 4G. Sai daqui sempre um JPEG de
 * 512x512 com menos de 100 KB.
 *
 * O envio vai direto do navegador para o Supabase, com a sessão do usuário; a
 * política do bucket só deixa gravar dentro da pasta com o id dele. O
 * servidor entra depois, só para guardar o endereço.
 */

const LADO = 512

async function carregarImagem(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(arquivo)
  }

  // Caminho de reserva para navegadores sem `createImageBitmap`.
  const endereco = URL.createObjectURL(arquivo)
  try {
    return await new Promise<HTMLImageElement>((resolver, rejeitar) => {
      const imagem = new Image()
      imagem.onload = () => resolver(imagem)
      imagem.onerror = () => rejeitar(new Error('Não foi possível ler a imagem.'))
      imagem.src = endereco
    })
  } finally {
    URL.revokeObjectURL(endereco)
  }
}

/** Corta o centro no quadrado e devolve um JPEG de LADO x LADO. */
async function prepararImagem(arquivo: File): Promise<Blob> {
  const imagem = await carregarImagem(arquivo)
  const largura = 'width' in imagem ? imagem.width : 0
  const altura = 'height' in imagem ? imagem.height : 0
  if (!largura || !altura) throw new Error('Não foi possível ler a imagem.')

  const tela = document.createElement('canvas')
  tela.width = LADO
  tela.height = LADO
  const contexto = tela.getContext('2d')
  if (!contexto) throw new Error('Este navegador não consegue preparar a imagem.')

  const menor = Math.min(largura, altura)
  contexto.drawImage(
    imagem as CanvasImageSource,
    (largura - menor) / 2,
    (altura - menor) / 2,
    menor,
    menor,
    0,
    0,
    LADO,
    LADO,
  )

  return new Promise((resolver, rejeitar) => {
    tela.toBlob(
      (blob) => (blob ? resolver(blob) : rejeitar(new Error('Não foi possível preparar a imagem.'))),
      'image/jpeg',
      0.85,
    )
  })
}

export default function FotoDePerfil({
  usuarioId,
  nome,
  url,
}: {
  usuarioId: string
  nome: string
  url: string | null
}) {
  const router = useRouter()
  const entrada = useRef<HTMLInputElement>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return

    setErro(null)
    setEnviando(true)
    let local: string | null = null

    try {
      const imagem = await prepararImagem(arquivo)
      local = URL.createObjectURL(imagem)
      setPrevia(local)

      const supabase = clienteNavegador()
      const caminho = caminhoDoAvatar(usuarioId)
      const { error } = await supabase.storage.from(BUCKET_AVATARES).upload(caminho, imagem, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600',
      })
      if (error) throw new Error(error.message)

      const { data } = supabase.storage.from(BUCKET_AVATARES).getPublicUrl(caminho)
      // O caminho é sempre o mesmo, então o navegador e a CDN guardariam a
      // foto antiga. O carimbo de tempo é o que força a nova a aparecer.
      const resposta = await salvarAvatar(`${data.publicUrl}?v=${Date.now()}`)
      if (!resposta.ok) throw new Error(resposta.motivo)

      router.refresh()
    } catch (falha) {
      setPrevia(null)
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar a foto.')
    } finally {
      if (local) URL.revokeObjectURL(local)
      setEnviando(false)
      if (entrada.current) entrada.current.value = ''
    }
  }

  async function remover() {
    setErro(null)
    setEnviando(true)
    try {
      const supabase = clienteNavegador()
      await supabase.storage.from(BUCKET_AVATARES).remove([caminhoDoAvatar(usuarioId)])
      const resposta = await salvarAvatar(null)
      if (!resposta.ok) throw new Error(resposta.motivo)
      setPrevia(null)
      router.refresh()
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível remover a foto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={enviando ? 'opacity-60 transition' : 'transition'}>
        <Avatar nome={nome} url={previa ?? url} tamanho="grande" />
      </div>

      <input
        ref={entrada}
        id="foto-de-perfil"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(evento) => escolher(evento.target.files?.[0])}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => entrada.current?.click()}
          className="h-10 rounded-full border border-borda px-4 text-[13px] font-medium text-texto transition active:bg-superficie-2 disabled:text-tenue"
        >
          {enviando ? 'Enviando…' : url ? 'Trocar foto' : 'Adicionar foto'}
        </button>

        {url ? (
          <button
            type="button"
            disabled={enviando}
            onClick={remover}
            className="h-10 rounded-full border border-borda px-4 text-[13px] font-medium text-suave transition active:bg-superficie-2 disabled:text-tenue"
          >
            Remover
          </button>
        ) : null}
      </div>

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
    </div>
  )
}
