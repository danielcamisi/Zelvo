import { redirect } from 'next/navigation'
import { usuarioAutenticado } from '@/modulos/auth/sessao'

// O `start_url` da PWA é `/`. Normalmente o proxy já resolve antes de chegar
// aqui; esta página é a rede de segurança para quando ele não roda.
export const dynamic = 'force-dynamic'

export default async function Raiz() {
  const usuario = await usuarioAutenticado()
  redirect(usuario ? '/hoje' : '/entrar')
}
