# Remoção do autocadastro público — 2026-08-01

## Contexto

A Fase 0 foi construída com um fluxo de autocadastro público (tela `/cadastro` com confirmação de e-mail via Supabase Auth, seguida de `/onboarding` onde o próprio usuário criava sua revenda). O usuário esclareceu o modelo de negócio real: **ele é quem vai vender e provisionar o sistema para os clientes através do painel administrativo** — as revendas não vão se autocadastrar.

## Decisão

Removido completamente:
- `/cadastro` (tela pública de criação de conta)
- `/onboarding` (fluxo de criação de tenant pelo próprio usuário)
- `/auth/confirm` (route handler de confirmação de e-mail)
- `signup` server action

O login (`/login`) passa a ser o único ponto de entrada público. O middleware foi simplificado: só faz o gate de autenticado/não-autenticado, sem mais branch de "tem profile vs. não tem" redirecionando para onboarding.

**Como o cliente final vai receber acesso**: o dono da plataforma cria a conta pelo painel administrativo (ainda não construído) — mesmo padrão já usado na tela de Equipe (usuário criado já confirmado via Admin API do Supabase, com senha temporária gerada, repassada ao cliente por fora do sistema). Sem depender de envio de e-mail de confirmação.

## Consequências

- Testes E2E não podem mais dirigir a criação de tenant pela UI (ela não existe mais). Criado o helper `createTenantWithGestor()` em `e2e/helpers/admin.ts`, que insere tenant+tenant_config+loja+profile diretamente via client com service role — replicando exatamente o que o painel administrativo fará. Isso substituiu os passos de preenchimento do formulário de onboarding nos specs `fase0.spec.ts` e `rls-isolation.spec.ts`.
- O teste que exercitava o formulário real de `/cadastro` (e o problema de rate-limit de e-mail que vínhamos documentando) deixou de existir — não é mais relevante, já que não há mais autocadastro.
- A RPC `onboarding_criar_tenant` (criada na migration `0002_fase0_onboarding_rpc.sql`) fica sem uso pelo app por enquanto — não foi removida do banco (é só uma função Postgres inerte), mas deve ser revisitada/substituída quando o painel administrativo for desenhado, já que aquele fluxo assumia que o próprio usuário logado criava seu tenant (`auth.uid()` == gestor), o que não é mais o caso — quem vai chamar essa operação é o dono da plataforma em nome de um usuário já criado.
- **Bug de ambiente encontrado durante a validação, não do código**: ao deletar as pastas de rota (`app/onboarding/`, etc.) com o servidor de dev do Next.js/Turbopack ainda rodando, o cache incremental do Turbopack ficou órfão referenciando `/onboarding/page`, causando um panic interno (`FATAL: An unexpected Turbopack error occurred`) que travava o carregamento de `/login` (tanto no Chrome real quanto no Chromium do Playwright — "Target crashed"). Resolvido matando o processo do dev server e apagando `.next/` por completo antes de reiniciar. Lição: sempre reiniciar o dev server do zero (matar processo + `rm -rf .next`) depois de remover pastas de rota inteiras, não só depois de editar arquivos.

## Referências

- [[Revenda360 — Visão Geral]]
- Painel administrativo do dono da plataforma: ainda arquitetado, não implementado — este é o próximo lugar que vai precisar de uma função equivalente a `onboarding_criar_tenant`, mas chamável pelo admin (service role) em nome de um usuário arbitrário já criado via Admin API, não pelo próprio usuário.
