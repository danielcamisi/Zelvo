import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FormularioMeta from '@/components/FormularioMeta'
import Voltar from '@/components/Voltar'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { dinheiroParaCampo } from '@/modulos/comum/rotulos'
import { buscarMeta } from '@/modulos/metas/consultas'

export const metadata: Metadata = { title: 'Editar meta · Zelvo' }

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const usuario = await exigirUsuario()
  const meta = await buscarMeta(usuario.id, id)
  if (!meta) notFound()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Voltar href={`/metas/${meta.id}`} rotulo="Voltar" />
        <h1 className="text-2xl font-semibold tracking-tight">Editar meta</h1>
      </div>

      <FormularioMeta
        metaId={meta.id}
        rotulo="Salvar alterações"
        valores={{
          titulo: meta.titulo,
          descricao: meta.descricao ?? '',
          categoria: meta.categoria,
          prioridade: meta.prioridade,
          dificuldade: meta.dificuldade,
          dataInicio: meta.dataInicio,
          prazo: meta.prazo ?? '',
          visibilidade: meta.visibilidade,
          valorAlvo: dinheiroParaCampo(meta.valorAlvo),
          valorAtual: dinheiroParaCampo(meta.valorAtual),
        }}
      />
    </div>
  )
}
