import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import BotaoPerigo from '@/components/BotaoPerigo'
import FormularioTarefa from '@/components/FormularioTarefa'
import Voltar from '@/components/Voltar'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { metasParaEscolha } from '@/modulos/metas/consultas'
import { alternarTarefaAtiva, excluirTarefa } from '@/modulos/tarefas/acoes'
import { buscarTarefa } from '@/modulos/tarefas/consultas'
import { tarefaEmCampos } from '@/modulos/tarefas/formulario'

export const metadata: Metadata = { title: 'Tarefa · Zelvo' }

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const usuario = await exigirUsuario()
  const tarefa = await buscarTarefa(usuario.id, id)
  if (!tarefa) notFound()

  const metas = await metasParaEscolha(usuario.id, tarefa.metaId)
  const voltarPara = tarefa.metaId ? `/metas/${tarefa.metaId}` : '/tarefas'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Voltar href={voltarPara} rotulo="Voltar" />
        <h1 className="text-2xl font-semibold tracking-tight">Editar tarefa</h1>
        {tarefa.ativa ? null : (
          <p className="text-[13px] text-suave">
            Esta tarefa está pausada: ela não aparece no seu dia, mas o histórico continua de pé.
          </p>
        )}
      </div>

      <FormularioTarefa
        tarefaId={tarefa.id}
        rotulo="Salvar alterações"
        metas={metas}
        valores={tarefaEmCampos(tarefa)}
      />

      <section className="flex flex-col gap-3 border-t border-borda pt-6">
        <h2 className="text-[17px] font-semibold tracking-tight">Situação</h2>

        {/* Pausar é o meio-termo entre deixar aparecendo todo dia e apagar: a
            tarefa sai do dia a dia sem levar junto o histórico. */}
        <form action={alternarTarefaAtiva}>
          <input type="hidden" name="tarefaId" value={tarefa.id} />
          <input type="hidden" name="ativa" value={tarefa.ativa ? 'false' : 'true'} />
          <button
            type="submit"
            className="h-12 w-full rounded-2xl border border-borda text-[14px] font-medium text-texto transition active:bg-superficie-2"
          >
            {tarefa.ativa ? 'Pausar tarefa' : 'Retomar tarefa'}
          </button>
        </form>

        <BotaoPerigo
          acao={excluirTarefa}
          ocultos={{ tarefaId: tarefa.id, voltarPara }}
          rotulo="Excluir tarefa"
          confirmacao="Excluir de vez"
          explicacao="Isso apaga a tarefa e todo o histórico de conclusões dela. Não dá para desfazer. Para só tirar do dia, pause."
        />
      </section>
    </div>
  )
}
