# 2026-08-01 — Fundação do Revenda 360 e rework de UI

## Contexto de entrada

Diretório de trabalho vazio, só continha `PROMPT-DESIGN-REVENDA360.md` (o prompt original de design) e o usuário pediu para construir o sistema real (Next.js + Supabase) a partir de um protótipo HTML navegável em `~/Downloads/Revenda 360 prototype built/`.

## O que foi feito

### 1. Pesquisa e planejamento

- Agente de exploração leu o protótipo completo (`Revenda360.dc.html`, `revenda-data.js`, `support.js`) e mapeou: só 6 das ~20 telas do menu estão de fato implementadas (Dashboard, Estoque, Entrada de veículo, Ficha do veículo, Nova venda, Contas a receber); as demais são stubs vazios. Confirmou que não há backend nem auth real no protótipo.
- Alinhamento com o usuário via perguntas: MVP enxuto + fases documentadas depois; SaaS multi-tenant desde já; integrações externas manuais por ora; Supabase Auth real com 3 papéis (gestor/vendedor/financeiro).
- Agente de planejamento desenhou a arquitetura completa (schema multi-tenant, RLS, estrutura Next.js, fases de construção) — resolveu a ambiguidade do "preço mínimo" do protótipo (campo cadastrado vs. `*1.08` hardcoded no wizard de venda).
- Plano salvo e aprovado pelo usuário (ver `~/.claude/plans/home-eltobsjr-downloads-revenda-360-pro-shimmying-pony.md`), com ajuste de pnpm → npm a pedido do usuário.

### 2. Fase 0 — Fundação

- Scaffold Next.js 16 (App Router, TypeScript, Tailwind, ESLint) com npm.
- Migrations SQL (`supabase/migrations/0001_fase0_fundacao.sql`, `0002_fase0_onboarding_rpc.sql`): tenants, tenant_config, lojas, profiles, RLS via `current_tenant_id()`, RPCs `security definer` para onboarding e criação de membro de equipe — geradas para o usuário rodar manualmente no SQL Editor do Supabase (sem CLI conectada, por pedido explícito do usuário).
- Clients Supabase (`lib/supabase/server.ts`, `client.ts`, `middleware.ts`) via `@supabase/ssr`, com client admin (service role) separado para operações privilegiadas.
- Auth completo: cadastro, login, confirmação de e-mail (route handler `/auth/confirm`), logout.
- Onboarding: cria tenant + primeira loja + perfil gestor via RPC.
- Tela de Equipe: gestor cria vendedor/financeiro (Admin API para criar o usuário + RPC para vincular o profile), mostra senha temporária.
- Shell de navegação: sidebar completa com toda a navegação do design (incluindo itens ainda placeholder), topbar com busca/tema/logout, drawer + bottom nav no mobile.
- Design tokens OKLCH portados do protótipo para `app/globals.css`.

### 3. Testes automatizados

- Configurado Playwright (`playwright.config.ts`, `e2e/`), com helpers de Admin API (`e2e/helpers/admin.ts`) para criar/confirmar/limpar usuários e tenants de teste sem depender de e-mail real (contornando o rate limit baixo do serviço de e-mail embutido do Supabase).
- **Bug real encontrado e corrigido pelos testes E2E**: o `redirect()` de dentro da Server Action de login não repassava pela mesma lógica do middleware — usuário sem onboarding completo caía direto no dashboard em vez de ser redirecionado para `/onboarding`. Corrigido fazendo a própria action de login verificar a existência do profile antes de decidir o destino (`app/(auth)/actions.ts`).
- Suíte final: 3 de 4 testes E2E passam de forma estável (login→onboarding→equipe→tema→logout, login de vendedor recém-criado, isolamento RLS entre 2 tenants). O 4º teste (cadastro via formulário real, que dispara e-mail de verdade) falha por rate limit do Supabase, não por bug — documentado no próprio teste.

### 4. Rework de UI (shadcn/ui)

- Usuário achou o visual customizado inicial feio; pedido para refazer com shadcn/ui.
- `npx shadcn@latest init` (preset "nova", base Base UI), com New York style (densidade) e paleta baseada em múltiplos temas de marca (Azul/Verde/Violeta/Neutro) trocáveis via dropdown no topbar (`components/brand-switcher.tsx`), persistidos em localStorage.
- Migração de tema claro/escuro para `next-themes`.
- Reconstrução de login/cadastro/onboarding/equipe/shell com componentes shadcn reais (Card, Input, Button, NativeSelect, Table, Badge, Sidebar block completo).
- **Segunda rodada de feedback**: usuário apontou que o resultado "parecia muito IA" (campos esticados, card de login genérico, raio uniforme, cor de marca subutilizada, tipografia padrão). Ajustes aplicados nos componentes compartilhados: altura de Input/Button/NativeSelect de h-8→h-9, layout de auth trocado de card centralizado para painel dividido (`components/auth-split-layout.tsx`), fonte Space Grotesk para títulos, tom de sidebar diferenciado do fundo.
- Auditoria de propagação: grep confirmando zero `h-8` hardcoded fora de `components/ui/`, zero heading sem `font-heading`; inspeção visual das telas Equipe (real) e Estoque (stub) confirmando consistência.
- Removidos 5 pacotes `@radix-ui/*` que ficaram sem uso (shadcn "nova" usa Base UI por baixo).

### 5. Limpeza

- Todos os tenants/usuários de teste criados durante desenvolvimento e QA visual foram removidos do projeto Supabase real ao final de cada rodada.

## Decisões registradas

- [[2026-08-01 - Arquitetura inicial multi-tenant]]
- [[2026-08-01 - Rework de UI para shadcn ui]]

## Pendências abertas

- Fase 1 (Estoque + Ficha do veículo) ainda não iniciada — é o próximo passo.
- Painel administrativo do dono da plataforma: arquitetura definida (app Next.js separado no monorepo, service role, allowlist de admin via tabela `platform_admins`), implementação não iniciada — usuário pediu para só arquitetar por enquanto.
- SMTP próprio do Supabase não configurado (necessário antes de produção).
- Deploy/CI não configurado.

## Regras combinadas nesta sessão

- Nunca commitar sem permissão explícita do usuário.
- Nunca incluir "Co-Authored-By: Claude" nos commits.
- Toda tela nova deve nascer com teste E2E Playwright.

## Estado do git ao final da sessão

Usuário autorizou o commit do trabalho acumulado. Organizado em 4 commits lógicos sobre o "Initial commit from Create Next App":

1. `5431eb0` — Add Supabase multi-tenant backend and auth infrastructure (migrations, RLS, clients, session helpers)
2. `7505f0f` — Build Fase 0 UI: auth, onboarding, team management, nav shell (todas as telas + shadcn/ui)
3. `b22377d` — Add Playwright E2E suite covering Fase 0 auth and RLS isolation
4. `c16fda8` — Add project instructions and original design brief (CLAUDE.md, PROMPT-DESIGN-REVENDA360.md)

Nenhum trailer de co-autoria do Claude nos commits (regra do usuário). Também corrigido `.gitignore`: o padrão `.env*` estava ignorando `.env.example` sem querer — adicionado `!.env.example` para mantê-lo versionado (não tem segredo, só documenta as variáveis necessárias).

Repositório remoto criado e conectado: **https://github.com/eltobsjr/revenda360** (privado), remote `origin`, branch `main` já com upstream configurado (`git push`/`git pull` funcionam direto).

## Ambiente ao final da sessão

- Dev server rodando em `localhost:3000` (processo em background, iniciado com `npm run dev`).
- Supabase do projeto real (`xjpmpvxxwsmegpnukuqs.supabase.co`) confirmado limpo de dados de teste (0 tenants, 0 usuários) após a última rodada de QA visual.
- Credenciais em `.env.local` (não versionado): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`. A secret key foi fornecida pelo usuário no chat — está apenas no `.env.local` local, nunca commitada.
