import type { Metadata } from 'next'
import FormularioTarefa from '@/components/FormularioTarefa'
import Voltar from '@/components/Voltar'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { metasParaEscolha } from '@/modulos/metas/consultas'
import { tarefaEmBranco } from '@/modulos/tarefas/formulario'
import { dataNoFuso } from '@/regras/datas'

export const metadata: Metadata = { title: 'Nova tarefa · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  const metas = await metasParaEscolha(usuario.id)
  const hoje = dataNoFuso(new Date(), usuario.timezone)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Voltar href="/tarefas" rotulo="Tarefas" />
        <h1 className="text-2xl font-semibold tracking-tight">Nova tarefa</h1>
      </div>

      <FormularioTarefa
        rotulo="Criar tarefa"
        metas={metas}
        valores={tarefaEmBranco(hoje)}
      />
    </div>
  )
}
