# Zelvo — Marco 1

PWA instalável no iPhone com push funcionando. Sem metas, sem tarefas, sem banco.
O objetivo deste marco é único: **confirmar que a notificação chega no seu iPhone.**
Se isso funcionar, toda a arquitetura de lembretes do Zelvo se sustenta. Se não,
melhor descobrir agora.

Arquitetura completa: `ZELVO_ARQUITETURA_PWA.md` nos arquivos do projeto.

---

## O que já está pronto

- Next.js 16 + TypeScript + Tailwind v4
- Manifest com `display: standalone` (obrigatório para o iOS liberar push)
- Ícones 192, 512, maskable e apple-touch-icon
- Service worker tratando `push` e `notificationclick`
- Botão que pede permissão e inscreve no push
- Endpoint que dispara um push de teste
- Painel de diagnóstico que mostra exatamente onde parou, se parar

---

## Passo 1 — Gere suas chaves VAPID

```bash
npm install
npm run gerar-vapid
```

Copie a saída para um arquivo `.env` na raiz:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:seu@email.com
```

Gere **uma vez só**. Trocar as chaves depois invalida todas as inscrições já feitas,
e o push passa a falhar com 403.

---

## Passo 2 — Publique

O push **não funciona em `localhost` pelo iPhone**: precisa de HTTPS num domínio real.
Por isso o teste acontece publicado, não na sua máquina.

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório. Ela detecta Next.js sozinha.
3. Em **Settings → Environment Variables**, cadastre as três variáveis do `.env`.
4. Deploy. Anote a URL, algo como `https://zelvo.vercel.app`.

Se mudar as variáveis depois, precisa refazer o deploy para valerem.

---

## Passo 3 — Instale no iPhone

1. Abra a URL no **Safari**. Precisa ser o Safari: o Chrome do iPhone não instala PWA.
2. Toque em **Compartilhar** (o quadrado com a seta para cima).
3. **Adicionar à Tela de Início**.
4. Feche o Safari e abra o Zelvo **pelo ícone novo**.

No painel de diagnóstico, "Instalado na tela de início" precisa estar **sim**.
Se estiver "não", você ainda está no Safari e o push não vai funcionar.

---

## Passo 4 — Teste

1. Toque em **Ativar lembretes** e aceite quando o iPhone perguntar.
2. Toque em **Enviar push de teste**.
3. **Bloqueie a tela** e espere alguns segundos.

Deve chegar: *08:30 — Tomar creatina · Melhorar minha saúde · +15 XP*

Tocar na notificação abre o app.

---

## Se não funcionar

Me mande o painel de diagnóstico inteiro. Ele diz onde parou. Os casos comuns:

| Sintoma | Causa provável |
|---|---|
| "Instalado na tela de início: não" | Abriu pelo Safari, não pelo ícone |
| Push API: não | iOS abaixo de 16.4, ou não está instalado |
| Permissão: denied | Recusou antes. Remova da tela de início, adicione de novo |
| Erro 403 ao testar | Chaves VAPID trocadas depois da inscrição, ou `VAPID_SUBJECT` inválido |
| Erro 410 ao testar | Inscrição expirou. Reinstale e ative de novo |
| Nada chega, sem erro | Modo Foco ou resumo de notificações ligado no iPhone |

O endpoint devolve um campo `diagnostico` com o status e a resposta crua do serviço
de push, então dá para ver a causa real sem abrir log de servidor.

---

## Rodar localmente

```bash
npm run dev
```

Abre em `http://localhost:3000`. No desktop dá para ver a tela e o diagnóstico,
mas o push de verdade só no iPhone publicado.

Verificação automática do service worker (com o servidor no ar):

```bash
npm run build && npx next start -p 3100 &
BASE=http://127.0.0.1:3100 node scripts/verificar-push.mjs
```

Ela entrega um push ao service worker num Chromium real e confere que a notificação
sai com título, corpo, tag, ícone e dados corretos.

---

## O que vem depois

Quando você confirmar que o push chegou: schema e migrations, auth, as regras
centralizadas em `src/regras/`, e daí as telas. Ordem completa na seção 8 da arquitetura.
