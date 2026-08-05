---
name: project-modelo-negocio
description: "Como revendas são provisionadas no Revenda360 — modelo de venda direta, não self-service"
metadata: 
  node_type: memory
  type: project
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-05T11:47:13.019Z
---

O Revenda360 é vendido diretamente pelo dono da plataforma (o usuário) para as revendas clientes — não é self-service. Por isso, o autocadastro público (`/cadastro`, `/onboarding`, confirmação de e-mail) foi removido em 2026-08-01. O único ponto de entrada público é `/login`.

Quando o dono fecha venda com uma revenda nova, ele mesmo cria a conta pelo painel administrativo `/admin` (v1 implementado em 2026-08-03, commit `8e3051b`, autor Enzo) — mesmo padrão já usado na tela de Equipe: usuário criado já confirmado via Supabase Admin API, RPC `provisionar_revenda` (security definer) cria tenant+loja+gestor, senha temporária gerada e repassada ao cliente por fora do sistema (WhatsApp/e-mail manual). Sem depender de envio de e-mail de confirmação do Supabase. O dono da plataforma não tem linha em `profiles` (não pertence a tenant nenhum) — identidade é a allowlist `platform_admins`, cuja primeira linha só pode ser inserida por SQL direto no Supabase (sem policy de insert).

**Why:** O usuário esclareceu o modelo de negócio depois que a Fase 0 já tinha sido construída com fluxo de self-signup — foi uma correção de rumo, não uma decisão original.
**How to apply:** Nunca reintroduzir telas de autocadastro público. Qualquer fluxo de "criar conta nova" parte do painel administrativo `/admin` ou de ação manual do dono, nunca de um formulário público. Ver `Revenda360SecondBrain/decisions/2026-08-01 - Remoção do autocadastro público.md` para o detalhe técnico da remoção, e `Revenda360SecondBrain/devtrack/2026-08-03 - Painel administrativo do dono da plataforma (v1).md` para o painel em si.
