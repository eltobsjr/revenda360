---
name: project-modelo-negocio
description: "Como revendas são provisionadas no Revenda360 — modelo de venda direta, não self-service"
metadata: 
  node_type: memory
  type: project
  originSessionId: c7f3581a-eded-4a56-8f13-349235ad7367
  modified: 2026-08-01T17:48:13.450Z
---

O Revenda360 é vendido diretamente pelo dono da plataforma (o usuário) para as revendas clientes — não é self-service. Por isso, o autocadastro público (`/cadastro`, `/onboarding`, confirmação de e-mail) foi removido em 2026-08-01. O único ponto de entrada público é `/login`.

Quando o dono fecha venda com uma revenda nova, ele mesmo cria a conta (via painel administrativo, ainda não construído) — mesmo padrão já usado na tela de Equipe: usuário criado já confirmado via Supabase Admin API, com senha temporária gerada, repassada ao cliente por fora do sistema (WhatsApp/e-mail manual). Sem depender de envio de e-mail de confirmação do Supabase.

**Why:** O usuário esclareceu o modelo de negócio depois que a Fase 0 já tinha sido construída com fluxo de self-signup — foi uma correção de rumo, não uma decisão original.
**How to apply:** Nunca reintroduzir telas de autocadastro público. Qualquer fluxo de "criar conta nova" deve partir do painel administrativo (que ainda precisa ser construído) ou de ação manual do dono, nunca de um formulário público. Ver `Revenda360SecondBrain/decisions/2026-08-01 - Remoção do autocadastro público.md` para o detalhe técnico completo, incluindo o helper `createTenantWithGestor` usado nos testes E2E para simular esse provisionamento.
