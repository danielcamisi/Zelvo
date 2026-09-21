import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import FormularioTarefa from '@/components/FormularioTarefa'
import Voltar from '@/components/Voltar'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { buscarMeta, metasParaEscolha } from '@/modulos/metas/consultas'
import { tarefaEmBranco } from '@/modulos/tarefas/formulario'
import { dataNoFuso } from '@/regras/datas'

export const metadata: Metadata = { title: 'Nova tarefa · Zelvo' }

/**
 * Mesma tela de nova tarefa, com a meta já escolhida. O usuário ainda pode
 * trocar no seletor — o caminho só decide o que vem preenchido.
 */
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const usuario = await exigirUsuario()
  const meta = await buscarMeta(usuario.id, id)
  if (!meta) notFound()

  const metas = await metasParaEscolha(usuario.id, meta.id)
  const hoje = dataNoFuso(new Date(), usuario.timezone)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Voltar href={`/metas/${meta.id}`} rotulo={meta.titulo} />
        <h1 className="text-2xl font-semibold tracking-tight">Nova tarefa</h1>
      </div>

      <FormularioTarefa
        rotulo="Criar tarefa"
        metas={metas}
        valores={tarefaEmBranco(hoje, meta.id)}
      />
    </div>
  )
}
