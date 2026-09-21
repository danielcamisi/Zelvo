'use client'

import { useActionState, useState } from 'react'
import Aviso from './Aviso'
import { AreaDeTexto, BotaoEnviar, Campo, Dias, Selecao } from './Campos'
import { criarTarefa, atualizarTarefa } from '@/modulos/tarefas/acoes'
import type { EstadoFormulario } from '@/modulos/comum/formulario'
import { DIAS_DA_SEMANA, PRIORIDADES, RECORRENCIAS, opcoes } from '@/modulos/comum/rotulos'
import type { MetaEscolhivel, ValoresTarefa } from '@/modulos/tarefas/formulario'

/**
 * Criar e editar tarefa.
 *
 * A tela muda conforme a repetição porque os campos mudam de significado:
 * "uma vez" pede um dia, "dias da semana" pede de segunda a domingo, "dias
 * do mês" pede números de 1 a 31. Mostrar tudo junto seria pedir que o
 * usuário adivinhe o que vale.
 */


const VAZIO: EstadoFormulario = {}

const DIAS_DO_MES = Array.from({ length: 31 }, (_, indice) => ({
  valor: indice + 1,
  texto: String(indice + 1),
  descricao: `Dia ${indice + 1}`,
}))

export default function FormularioTarefa({
  tarefaId,
  valores,
  metas,
  rotulo,
}: {
  tarefaId?: string
  valores: ValoresTarefa
  metas: MetaEscolhivel[]
  rotulo: string
}) {
  const [estado, acao] = useActionState(tarefaId ? atualizarTarefa : criarTarefa, VAZIO)
  const [campos, setCampos] = useState(valores)
  const erros = estado.erros ?? {}

  const mudar = (nome: keyof ValoresTarefa) => (evento: { target: { value: string } }) =>
    setCampos((atual) => ({ ...atual, [nome]: evento.target.value }))

  const alternarDia = (valor: number) =>
    setCampos((atual) => ({
      ...atual,
      recorrenciaDias: atual.recorrenciaDias.includes(valor)
        ? atual.recorrenciaDias.filter((dia) => dia !== valor)
        : [...atual.recorrenciaDias, valor].sort((a, b) => a - b),
    }))

  const { recorrencia } = campos
  const temDataUnica = recorrencia === 'unica' || recorrencia === 'anual'
  const temPeriodo = recorrencia !== 'unica'

  return (
    <form action={acao} className="flex flex-col gap-4">
      {tarefaId ? <input type="hidden" name="tarefaId" value={tarefaId} /> : null}

      <Campo
        nome="titulo"
        rotulo="Título"
        placeholder="Tomar creatina"
        maxLength={80}
        erro={erros.titulo}
        value={campos.titulo}
        onChange={mudar('titulo')}
        required
      />

      <AreaDeTexto
        nome="descricao"
        rotulo="Descrição"
        placeholder="Opcional."
        maxLength={500}
        erro={erros.descricao}
        value={campos.descricao}
        onChange={mudar('descricao')}
      />

      <Selecao
        nome="metaId"
        rotulo="Meta"
        opcoes={[['', 'Sem meta'], ...metas.map((meta): [string, string] => [meta.id, meta.titulo])]}
        apoio="Tarefa sem meta também vale; ela só não conta para nenhum objetivo."
        erro={erros.metaId}
        value={campos.metaId}
        onChange={mudar('metaId')}
      />

      <Selecao
        nome="recorrencia"
        rotulo="Repetição"
        opcoes={opcoes(RECORRENCIAS)}
        erro={erros.recorrencia}
        value={campos.recorrencia}
        onChange={mudar('recorrencia')}
      />

      {recorrencia === 'semanal' ? (
        <Dias
          nome="recorrenciaDias"
          rotulo="Em quais dias"
          valores={DIAS_DA_SEMANA.map((dia) => ({
            valor: dia.valor,
            texto: dia.curto,
            descricao: dia.longo,
          }))}
          selecionados={campos.recorrenciaDias}
          aoAlternar={alternarDia}
          erro={erros.recorrenciaDias}
        />
      ) : null}

      {recorrencia === 'mensal' ? (
        <Dias
          nome="recorrenciaDias"
          rotulo="Em quais dias do mês"
          valores={DIAS_DO_MES}
          selecionados={campos.recorrenciaDias}
          aoAlternar={alternarDia}
          apoio="Dia 29, 30 ou 31 é ignorado nos meses que não têm essa data."
          erro={erros.recorrenciaDias}
        />
      ) : null}

      {temDataUnica ? (
        <Campo
          nome="dataUnica"
          rotulo={recorrencia === 'anual' ? 'Dia e mês' : 'Dia'}
          type="date"
          apoio={recorrencia === 'anual' ? 'O dia e o mês se repetem todo ano.' : undefined}
          erro={erros.dataUnica}
          value={campos.dataUnica}
          onChange={mudar('dataUnica')}
          required
        />
      ) : null}

      {temPeriodo ? (
        <div className="grid grid-cols-2 gap-3">
          <Campo
            nome="inicioEm"
            rotulo="Vale a partir de"
            type="date"
            erro={erros.inicioEm}
            value={campos.inicioEm}
            onChange={mudar('inicioEm')}
            required
          />
          <Campo
            nome="fimEm"
            rotulo="Até"
            type="date"
            erro={erros.fimEm}
            value={campos.fimEm}
            onChange={mudar('fimEm')}
          />
        </div>
      ) : (
        // A tarefa única não tem período para o usuário escolher, mas o
        // campo continua obrigatório no banco: vai junto, em silêncio.
        <input type="hidden" name="inicioEm" value={campos.inicioEm} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Campo
          nome="horario"
          rotulo="Horário"
          type="time"
          apoio="Sem horário, não há lembrete."
          erro={erros.horario}
          value={campos.horario}
          onChange={mudar('horario')}
        />
        <Selecao
          nome="prioridade"
          rotulo="Prioridade"
          opcoes={opcoes(PRIORIDADES)}
          erro={erros.prioridade}
          value={campos.prioridade}
          onChange={mudar('prioridade')}
        />
      </div>

      <Campo
        nome="xp"
        rotulo="XP por conclusão"
        type="number"
        min={0}
        max={500}
        inputMode="numeric"
        placeholder="Automático"
        apoio="Em branco, o XP sai da prioridade."
        erro={erros.xp}
        value={campos.xp}
        onChange={mudar('xp')}
      />

      {erros.formulario ? <Aviso tipo="erro">{erros.formulario}</Aviso> : null}

      <BotaoEnviar rotulo={rotulo} />
    </form>
  )
}
