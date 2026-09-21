import { redirect } from 'next/navigation'

/**
 * A instalação virou uma seção de /configuracoes. Esta rota continua
 * existindo porque pode estar salva em um atalho na tela de início ou em um
 * link antigo — redirecionar é mais barato que devolver 404.
 */
export default function Pagina() {
  redirect('/configuracoes')
}
