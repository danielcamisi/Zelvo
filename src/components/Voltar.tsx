import Link from 'next/link'
import { IconeSeta } from './Icones'

/**
 * Voltar da tela de formulário ou de detalhe.
 *
 * É um link para um destino conhecido, não `history.back()`: quem chega
 * pelo push de um lembrete não tem histórico para voltar.
 */
export default function Voltar({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 flex w-fit items-center gap-1 rounded-xl py-1 pr-2 text-[13px] text-suave transition active:text-texto"
    >
      <IconeSeta className="h-4 w-4 rotate-180" />
      {rotulo}
    </Link>
  )
}
