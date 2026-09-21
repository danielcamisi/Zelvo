'use client'

import { useFormStatus } from 'react-dom'

/**
 * Peças de formulário do app.
 *
 * Todas seguem a mesma anatomia: rótulo acima, controle de 52px de altura
 * (alvo de toque confortável no celular) e, abaixo, ou a mensagem de erro ou
 * o texto de apoio — nunca os dois, para a linha não dançar quando o erro
 * aparece.
 *
 * Nenhuma delas guarda estado. Quem usa é que controla o valor, porque o
 * React 19 limpa formulários não controlados quando a Server Action termina,
 * e perder o que já foi digitado por causa de um título curto é inaceitável
 * no celular.
 */

const BASE_CONTROLE =
  'rounded-2xl border bg-superficie px-4 text-[15px] text-texto outline-none placeholder:text-tenue focus:border-borda-forte'

function borda(erro?: string) {
  return erro ? 'border-acento' : 'border-borda'
}

function Envolucro({
  nome,
  rotulo,
  erro,
  apoio,
  children,
}: {
  nome: string
  rotulo: string
  erro?: string
  apoio?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={nome} className="text-[13px] font-medium text-suave">
        {rotulo}
      </label>
      {children}
      {erro ? (
        <span id={`${nome}-erro`} className="text-[13px] font-medium text-texto">
          {erro}
        </span>
      ) : apoio ? (
        <span id={`${nome}-apoio`} className="text-[12px] text-tenue">
          {apoio}
        </span>
      ) : null}
    </div>
  )
}

function descrito(nome: string, erro?: string, apoio?: string) {
  if (erro) return `${nome}-erro`
  if (apoio) return `${nome}-apoio`
  return undefined
}

export function Campo({
  nome,
  rotulo,
  erro,
  apoio,
  ...resto
}: {
  nome: string
  rotulo: string
  erro?: string
  apoio?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Envolucro nome={nome} rotulo={rotulo} erro={erro} apoio={apoio}>
      <input
        id={nome}
        name={nome}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito(nome, erro, apoio)}
        className={`h-13 ${BASE_CONTROLE} ${borda(erro)}`}
        {...resto}
      />
    </Envolucro>
  )
}

export function AreaDeTexto({
  nome,
  rotulo,
  erro,
  apoio,
  ...resto
}: {
  nome: string
  rotulo: string
  erro?: string
  apoio?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Envolucro nome={nome} rotulo={rotulo} erro={erro} apoio={apoio}>
      <textarea
        id={nome}
        name={nome}
        rows={3}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito(nome, erro, apoio)}
        className={`py-3.5 leading-relaxed ${BASE_CONTROLE} ${borda(erro)}`}
        {...resto}
      />
    </Envolucro>
  )
}

export function Selecao({
  nome,
  rotulo,
  opcoes,
  erro,
  apoio,
  ...resto
}: {
  nome: string
  rotulo: string
  opcoes: [string, string][]
  erro?: string
  apoio?: string
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Envolucro nome={nome} rotulo={rotulo} erro={erro} apoio={apoio}>
      <select
        id={nome}
        name={nome}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descrito(nome, erro, apoio)}
        // `appearance-none` some com a seta nativa, então o fundo desenha a
        // nossa — sem isso o iOS pinta o controle de branco.
        className={`h-13 appearance-none bg-[length:10px] bg-[right_1.1rem_center] bg-no-repeat pr-10 ${BASE_CONTROLE} ${borda(erro)}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none' stroke='%23a1a1ab' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M1 1l4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...resto}
      >
        {opcoes.map(([valor, texto]) => (
          <option key={valor} value={valor} className="bg-superficie text-texto">
            {texto}
          </option>
        ))}
      </select>
    </Envolucro>
  )
}

/**
 * Grupo de dias (semana ou mês) como botões alternáveis.
 *
 * São checkboxes de verdade, só escondidos: manter o input é o que faz o
 * teclado, o leitor de tela e o `FormData.getAll` continuarem funcionando.
 */
export function Dias({
  nome,
  rotulo,
  valores,
  selecionados,
  aoAlternar,
  erro,
  apoio,
}: {
  nome: string
  rotulo: string
  valores: { valor: number; texto: string; descricao?: string }[]
  selecionados: number[]
  aoAlternar: (valor: number) => void
  erro?: string
  apoio?: string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium text-suave">{rotulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {valores.map(({ valor, texto, descricao }) => {
          const marcado = selecionados.includes(valor)
          return (
            <label
              key={valor}
              className={`flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-[13px] font-medium transition ${
                marcado
                  ? 'border-acento bg-superficie-3 text-texto'
                  : 'border-borda bg-superficie text-tenue'
              }`}
            >
              <input
                type="checkbox"
                name={nome}
                value={valor}
                checked={marcado}
                onChange={() => aoAlternar(valor)}
                aria-label={descricao ?? texto}
                className="sr-only"
              />
              {texto}
            </label>
          )
        })}
      </div>
      {erro ? (
        <span className="text-[13px] font-medium text-texto">{erro}</span>
      ) : apoio ? (
        <span className="text-[12px] text-tenue">{apoio}</span>
      ) : null}
    </fieldset>
  )
}

export function BotaoEnviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-13 w-full rounded-2xl bg-acento text-[15px] font-semibold text-fundo transition active:scale-[0.99] disabled:bg-superficie-2 disabled:text-suave"
    >
      {pending ? 'Salvando…' : rotulo}
    </button>
  )
}
