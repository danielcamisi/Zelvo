/* Service worker do Zelvo.
 * Marco 1: só o caminho de notificação. Cache offline entra depois.
 * Este arquivo é público — nunca coloque segredo aqui.
 */

self.addEventListener('install', () => {
  // Assume o controle sem esperar o usuário fechar todas as abas.
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim())
})

self.addEventListener('push', (evento) => {
  let dados = {}
  try {
    dados = evento.data ? evento.data.json() : {}
  } catch {
    dados = { titulo: 'Zelvo', corpo: evento.data ? evento.data.text() : '' }
  }

  const titulo = dados.titulo || 'Zelvo'
  const opcoes = {
    body: dados.corpo || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // Agrupa pela tarefa para um lembrete não empilhar em cima do outro.
    tag: dados.tag || 'zelvo',
    renotify: true,
    data: {
      url: dados.url || '/',
      tarefaId: dados.tarefaId || null,
      dataReferencia: dados.dataReferencia || null,
    },
  }

  // waitUntil é obrigatório: sem ele o iOS pode matar o worker antes de mostrar.
  evento.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = (evento.notification.data && evento.notification.data.url) || '/'

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      // Se o app já estiver aberto, foca nele em vez de abrir outra instância.
      for (const janela of janelas) {
        if ('focus' in janela) {
          janela.navigate?.(destino)
          return janela.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
