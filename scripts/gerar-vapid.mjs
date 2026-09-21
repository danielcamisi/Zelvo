// Gera o par de chaves VAPID usado para assinar os pushes.
// Rodar UMA vez: node scripts/gerar-vapid.mjs
// A chave privada nunca vai para o cliente nem para o git.
import webpush from 'web-push'

const chaves = webpush.generateVAPIDKeys()

console.log('\nCole isto no seu .env (e nas variaveis de ambiente da Vercel):\n')
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + chaves.publicKey)
console.log('VAPID_PRIVATE_KEY=' + chaves.privateKey)
console.log('VAPID_SUBJECT=mailto:seu@email.com')
console.log('\nGuarde a privada. Trocar as chaves invalida todas as inscricoes existentes.\n')
