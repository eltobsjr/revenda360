# 2026-08-06 — Fase 7 (Deploy/CI)

Sessão iniciada pelo Enzo depois do `git pull origin main` (mensagem de
continuidade da sessão anterior). Primeira fase do roadmap pós-MVP
(`prioridade/atual.md`, Tier 0).

## Contexto: duplicidade de pasta local do Enzo

Antes de tocar a fase, a sessão encontrou duas cópias do projeto na máquina
do Enzo: `C:\Users\Kenji\dev\revenda360\` (sem `.git`, desatualizada, sem o
painel admin) e `C:\Users\Kenji\dev\revenda360\revenda360\` (com `.git` real,
sincronizada com `origin/main`). Confirmado com o Enzo que a pasta interna é
a correta — é a mesma raiz que o comentário em `next.config.ts`
(`turbopack.root`) já documentava como fonte de bugs de build por
`package-lock.json` duplicado acima do repo. Sessões futuras devem operar em
`...\revenda360\revenda360\`.

## O que foi feito

1. **Build limpo confirmado** — `npm run build` passa sem erro. Testado
   também **sem** `.env.local` presente (simulando o runner do GitHub
   Actions, que não tem acesso a esse arquivo): build continua passando,
   porque nenhuma rota estática (`/`, `/login`, `/_not-found`) chama o
   client Supabase em tempo de build — todas as rotas que usam
   `lib/supabase/*` são dinâmicas (`ƒ`). Ou seja, o CI não precisa de
   nenhum segredo configurado como GitHub Secret pra rodar `npm run build`.
2. **Revisão de dependência de ambiente local** — `lib/supabase/client.ts`,
   `server.ts` e `middleware.ts` usam `process.env.X!` sem fallback pra
   localhost (comportamento correto: falha alto se a env var faltar, em vez
   de mascarar com um valor errado). Único uso de `localhost` fora de
   documentação é `playwright.config.ts` (`baseURL`/`webServer`), que é
   específico de E2E local e não entra no build de produção.
3. **Workflow de CI criado** — `.github/workflows/ci.yml`: roda em todo push
   e PR pra `main`, sequência `npm ci` → typecheck (`tsc --noEmit`) → lint
   (`npm run lint`) → testes unitários (`npm run test -- --run`) → build
   (`npm run build`). Qualquer passo falhando quebra o workflow (sem
   `continue-on-error`). Testes E2E (Playwright) **não** entram no CI ainda
   — deixados como TODO comentado no próprio workflow, porque dependem de
   um banco Supabase real (`e2e/helpers/admin.ts` usa a service role key
   pra provisionar dados), indisponível no runner hoje.
4. **Verificação completa antes de commitar**: typecheck limpo, lint limpo,
   46 testes unitários passando (6 arquivos), build limpo — com e sem
   `.env.local`.

## Decisão registrada

- CI roda em Node 22 (LTS ativa) no runner `ubuntu-latest` — não havia
  `.nvmrc` nem `engines` no `package.json` fixando versão; Node 22 foi
  escolhido por ser a LTS ativa e compatível com Next 16 + React 19.

## O que NÃO foi feito nesta fase (é do Enzo, fora do alcance do Claude Code)

- Criar a conta na Vercel, conectar o repositório `eltobsjr/revenda360` e
  configurar as env vars de produção (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `NEXT_PUBLIC_SITE_URL`) — Parte 1 da Fase 7 no guia de construção. Sem
  isso, a Fase 7 não está de fato concluída (o app ainda não está acessível
  publicamente), só o CI (Parte 2) está pronto.

## Pendências abertas

- Enzo precisa fazer o deploy manual na Vercel (Parte 1 do guia) e rodar o
  checklist de teste manual da Fase 7 (login em produção, criar revenda de
  teste pelo `/admin`, conferir que a aba Actions do GitHub mostra o
  workflow novo rodando verde).
- Depois disso, seguir pra Fase 8 (Vendas realizadas), próxima da ordem de
  prioridade.
