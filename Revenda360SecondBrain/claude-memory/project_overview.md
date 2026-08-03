---
name: project-overview
description: "Stack, objetivo e contexto geral do Revenda360"
metadata: 
  node_type: memory
  type: project
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-03T16:15:54.113Z
---

Revenda360: SaaS multi-tenant de gestão para revendas de carros e motos seminovos no Brasil — substitui o controle por Excel (estoque, vendas, crediário, contas a receber, dashboard).

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase (Postgres/Auth/Storage) + Tailwind v4 + shadcn/ui (preset nova) + next-themes + Vitest + Playwright + npm.

**Modo:** equipe pequena (2-5), sem issue tracker formal, tasks soltas (plano de fases documentado serve de guia).

**Origem:** construído a partir de um protótipo HTML navegável (`Revenda360.dc.html`) que validou UX/dados/regras de negócio, mas não tinha backend real — é referência, não código a portar.

**Estado em 2026-08-03: MVP completo — as 6 fases do plano original estão implementadas e testadas via E2E** (Fase 0 fundação, Fase 1 Estoque, Fase 2 Entrada de veículo, Fase 3 Clientes básico, Fase 4 Nova venda com RPC transacional `fechar_venda`, Fase 5 Contas a receber com juros/multa configuráveis por tenant, Fase 6 Dashboard agregando dados de todas as fases anteriores). Design reconstruído com shadcn/ui após duas rodadas de feedback do usuário sobre o visual. Autocadastro público removido — o dono da plataforma provisiona as revendas (modelo de venda direta, não self-service); painel administrativo ainda não construído, então provisionamento de tenant novo hoje é manual — **esse painel é agora o candidato mais forte a próxima grande frente de trabalho**, por ser o único bloqueio real para vender a plataforma a um cliente de verdade. Não há mais "próxima fase" no plano original; o que resta está em `prioridade/atual.md` sob "Pós-MVP" e "Fora da sequência de fases".

**Why:** Contexto inicial registrado no setup do SecondBrain, após sessão extensa de construção da Fase 0.
**How to apply:** Usar para entender escopo e propósito antes de qualquer tarefa. Ver `Revenda360SecondBrain/Revenda360 — Visão Geral.md` e `Revenda360SecondBrain/prioridade/atual.md` no repositório para o estado detalhado e o plano de fases completo. Ver também [[project_arquitetura_supabase]] e [[feedback_design_system]].
