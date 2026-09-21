'use client'

import { useActionState, useState } from 'react'
import Aviso from './Aviso'
import { AreaDeTexto, BotaoEnviar, Campo, Selecao } from './Campos'
import { criarMeta, atualizarMeta } from '@/modulos/metas/acoes'
import type { EstadoFormulario } from '@/modulos/comum/formulario'
import { CATEGORIAS, DIFICULDADES, PRIORIDADES, VISIBILIDADES, opcoes } from '@/modulos/comum/rotulos'

/**
 * Criar e editar meta usam o mesmo formulário: os campos são idênticos e
 * manter duas telas gêmeas significaria corrigir cada regra duas vezes. A
 * diferença é só qual Server Action recebe o envio.
 */

export type ValoresMeta = {
  titulo: string
  descricao: string
  categoria: string
  prioridade: string
  dificuldade: string
  dataInicio: string
  prazo: string
  visibilidade: string
  valorAlvo: string
  valorAtual: string
}

const VAZIO: EstadoFormulario = {}

export default function FormularioMeta({
  metaId,
  valores,
  rotulo,
}: {
  /** Presente só na edição. */
  metaId?: string
  valores: ValoresMeta
  rotulo: string
}) {
  const [estado, acao] = useActionState(metaId ? atualizarMeta : criarMeta, VAZIO)
  const [campos, setCampos] = useState(valores)
  const erros = estado.erros ?? {}

  const mudar = (nome: keyof ValoresMeta) => (evento: { target: { value: string } }) =>
    setCampos((atual) => ({ ...atual, [nome]: evento.target.value }))

  // Dinheiro só existe em meta de Finanças — é o que a validação aceita.
  // Esconder os campos fora disso evita o erro antes de ele acontecer.
  const financeira = campos.categoria === 'financas'

  return (
    <form action={acao} className="flex flex-col gap-4">
      {metaId ? <input type="hidden" name="metaId" value={metaId} /> : null}

      <Campo
        nome="titulo"
        rotulo="Título"
        placeholder="Correr 5 km sem parar"
        maxLength={80}
        erro={erros.titulo}
        value={campos.titulo}
        onChange={mudar('titulo')}
        required
      />

      <AreaDeTexto
        nome="descricao"
        rotulo="Descrição"
        placeholder="Opcional. O que conta como pronto?"
        maxLength={500}
        erro={erros.descricao}
        value={campos.descricao}
        onChange={mudar('descricao')}
      />

      <Selecao
        nome="categoria"
        rotulo="Categoria"
        opcoes={opcoes(CATEGORIAS)}
        erro={erros.categoria}
        value={campos.categoria}
        onChange={mudar('categoria')}
      />

      <div className="grid grid-cols-2 gap-3">
        <Selecao
          nome="prioridade"
          rotulo="Prioridade"
          opcoes={opcoes(PRIORIDADES)}
          erro={erros.prioridade}
          value={campos.prioridade}
          onChange={mudar('prioridade')}
        />
        <Selecao
          nome="dificuldade"
          rotulo="Dificuldade"
          opcoes={opcoes(DIFICULDADES)}
          erro={erros.dificuldade}
          value={campos.dificuldade}
          onChange={mudar('dificuldade')}
        />
      </div>
      <p className="-mt-1 text-[12px] text-tenue">
        Prioridade e dificuldade definem o XP da meta. O valor é calculado ao salvar.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Campo
          nome="dataInicio"
          rotulo="Início"
          type="date"
          erro={erros.dataInicio}
          value={campos.dataInicio}
          onChange={mudar('dataInicio')}
          required
        />
        <Campo
          nome="prazo"
          rotulo="Prazo"
          type="date"
          erro={erros.prazo}
          value={campos.prazo}
          onChange={mudar('prazo')}
        />
      </div>

      {financeira ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo
              nome="valorAlvo"
              rotulo="Quero chegar a"
              inputMode="decimal"
              placeholder="15000,00"
              erro={erros.valorAlvo}
              value={campos.valorAlvo}
              onChange={mudar('valorAlvo')}
            />
            <Campo
              nome="valorAtual"
              rotulo="Já tenho"
              inputMode="decimal"
              placeholder="0,00"
              erro={erros.valorAtual}
              value={campos.valorAtual}
              onChange={mudar('valorAtual')}
            />
          </div>
          <p className="text-[12px] text-tenue">
            Valores em dinheiro são sempre privados: não aparecem para ninguém, mesmo em meta
            pública.
          </p>
        </div>
      ) : null}

      <Selecao
        nome="visibilidade"
        rotulo="Quem pode ver"
        opcoes={opcoes(VISIBILIDADES)}
        apoio="Toda meta nasce privada. Pública só mostra título e progresso."
        erro={erros.visibilidade}
        value={campos.visibilidade}
        onChange={mudar('visibilidade')}
      />

      {erros.formulario ? <Aviso tipo="erro">{erros.formulario}</Aviso> : null}

      <BotaoEnviar rotulo={rotulo} />
    </form>
  )
}
