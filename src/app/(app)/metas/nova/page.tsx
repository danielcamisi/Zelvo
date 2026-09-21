import type { Metadata } from 'next'
import FormularioMeta from '@/components/FormularioMeta'
import Voltar from '@/components/Voltar'
import { exigirUsuario } from '@/modulos/auth/sessao'
import { dataNoFuso } from '@/regras/datas'

export const metadata: Metadata = { title: 'Nova meta · Zelvo' }

export default async function Pagina() {
  const usuario = await exigirUsuario()
  // Começar hoje é o caso comum, e uma data já preenchida é um toque a menos
  // no celular. O dia sai do fuso do usuário, não do servidor, que roda em UTC.
  const hoje = dataNoFuso(new Date(), usuario.timezone)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Voltar href="/metas" rotulo="Metas" />
        <h1 className="text-2xl font-semibold tracking-tight">Nova meta</h1>
      </div>

      <FormularioMeta
        rotulo="Criar meta"
        valores={{
          titulo: '',
          descricao: '',
          categoria: 'saude',
          prioridade: 'media',
          dificuldade: 'media',
          dataInicio: hoje,
          prazo: '',
          visibilidade: 'privada',
          valorAlvo: '',
          valorAtual: '',
        }}
      />
    </div>
  )
}
