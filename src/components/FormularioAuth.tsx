'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { cadastrar, entrar, type EstadoFormulario } from '@/modulos/auth/acoes'
import { sugerirUsername } from '@/modulos/auth/validacao'

const VAZIO: EstadoFormulario = {}

function Botao({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-13 w-full rounded-2xl bg-acento text-[15px] font-semibold text-fundo transition active:scale-[0.99] disabled:opacity-55"
    >
      {pending ? 'Aguarde…' : rotulo}
    </button>
  )
}

function Campo({
  nome,
  rotulo,
  tipo = 'text',
  erro,
  ...resto
}: {
  nome: string
  rotulo: string
  tipo?: string
  erro?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-suave">{rotulo}</span>
      <input
        name={nome}
        type={tipo}
        aria-invalid={erro ? true : undefined}
        className={`h-13 rounded-2xl border bg-superficie px-4 text-[15px] text-texto outline-none placeholder:text-suave/60 focus:border-acento ${
          erro ? 'border-alerta' : 'border-borda'
        }`}
        {...resto}
      />
      {erro ? <span className="text-[13px] text-alerta">{erro}</span> : null}
    </label>
  )
}

export default function FormularioAuth({ proximo }: { proximo?: string }) {
  const [aba, setAba] = useState<'entrar' | 'cadastrar'>('entrar')
  const [estadoEntrar, acaoEntrar] = useActionState(entrar, VAZIO)
  const [estadoCadastro, acaoCadastro] = useActionState(cadastrar, VAZIO)
  // Estes campos são controlados de propósito. O React 19 limpa o
  // formulário quando a action termina, e perder o que já foi digitado só
  // porque a senha era curta é péssimo no celular. A senha, essa sim, some —
  // como em qualquer login.
  const [nome, setNome] = useState('')
  const [emailLogin, setEmailLogin] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [tocouUsername, setTocouUsername] = useState(false)

  // Enquanto ele não digitar um username, acompanha o e-mail. Uma tela a
  // menos para preencher no celular.
  useEffect(() => {
    if (!tocouUsername) setUsername(sugerirUsername(email))
  }, [email, tocouUsername])

  const estado = aba === 'entrar' ? estadoEntrar : estadoCadastro
  const erros = estado.erros ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-superficie p-1">
        {(['entrar', 'cadastrar'] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setAba(valor)}
            className={`h-10 rounded-xl text-[14px] font-semibold transition ${
              aba === valor ? 'bg-superficie-2 text-texto' : 'text-suave'
            }`}
          >
            {valor === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      {aba === 'entrar' ? (
        <form action={acaoEntrar} className="flex flex-col gap-4" key="entrar">
          <input type="hidden" name="proximo" value={proximo ?? ''} />
          <Campo
            nome="email"
            rotulo="E-mail"
            tipo="email"
            erro={erros.email}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            value={emailLogin}
            onChange={(evento) => setEmailLogin(evento.target.value)}
            required
          />
          <Campo
            nome="senha"
            rotulo="Senha"
            tipo="password"
            erro={erros.senha}
            autoComplete="current-password"
            required
          />
          <Botao rotulo="Entrar" />
        </form>
      ) : (
        <form action={acaoCadastro} className="flex flex-col gap-4" key="cadastrar">
          <Campo
            nome="nome"
            rotulo="Nome"
            erro={erros.nome}
            autoComplete="name"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            required
          />
          <Campo
            nome="email"
            rotulo="E-mail"
            tipo="email"
            erro={erros.email}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
          <Campo
            nome="username"
            rotulo="Username"
            erro={erros.username}
            autoComplete="username"
            autoCapitalize="none"
            placeholder="daniel"
            value={username}
            onChange={(evento) => {
              setTocouUsername(true)
              setUsername(evento.target.value)
            }}
            required
          />
          <Campo
            nome="senha"
            rotulo="Senha"
            tipo="password"
            erro={erros.senha}
            autoComplete="new-password"
            required
          />
          <Botao rotulo="Criar conta" />
        </form>
      )}

      {erros.formulario ? (
        <p className="rounded-2xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-[14px] text-alerta">
          {erros.formulario}
        </p>
      ) : null}

      {estado.aviso ? (
        <p className="rounded-2xl border border-acento/35 bg-acento/10 px-4 py-3 text-[14px] text-acento">
          {estado.aviso}
        </p>
      ) : null}
    </div>
  )
}
