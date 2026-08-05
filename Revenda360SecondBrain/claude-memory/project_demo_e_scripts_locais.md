---
name: project-demo-e-scripts-locais
description: "Existe um tenant de demonstração seedado no Supabase real, e um padrão de scripts locais não versionados pra qualquer script que precise de credencial"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1c59cee9-8a0e-49ed-be1a-a2fb6d8153d5
  modified: 2026-08-05T12:39:09.945Z
---

Existe uma revenda de demonstração real no Supabase ("Revenda Demo"), criada em 2026-08-05, com estoque/clientes/vendas de exemplo e 3 logins (gestor/vendedor/financeiro) — usada tanto pra teste manual quanto pra apresentação a clientes em potencial. Documentada em `Revenda360SecondBrain/guia-teste-funcionalidades.md` (credenciais lá, não repito aqui). Script que cria/reseta: `scripts/local-seed-demo-tenant.mjs`.

Também existe uma conta de dono da plataforma já provisionada (`platform_admins`), criada por `scripts/local-seed-platform-admin.mjs`.

Ambos os scripts seguem um padrão novo estabelecido em 2026-08-05: qualquer script de execução única que precise de credencial real (senha, e-mail de login) fica em `scripts/local-*` — path ignorado pelo git (`.gitignore`, comentário "scripts locais de execução única com segredo embutido — nunca versionar"). Usam a Admin API do Supabase (`@supabase/supabase-js` + `SUPABASE_SECRET_KEY` de `.env.local`) — nunca INSERT direto em `auth.users`/`auth.identities` (schema interno frágil entre versões do Supabase), mesmo mecanismo já usado em `criarMembroEquipe`/`criarRevenda`/`e2e/helpers/admin.ts`.

**Why:** Precisava de logins de teste reais (não mock — [[feedback_dados_dinamicos]] proíbe dado fixo na UI, mas dado real seedado no banco pra demo é diferente) pra mandar pro Enzo testar e apresentar a clientes; e precisava criar a própria conta de dono da plataforma depois que o painel administrativo (`/admin`) foi construído.
**How to apply:** Se precisar seedar mais dado de demo/reset o tenant demo, reaproveitar/editar `scripts/local-seed-demo-tenant.mjs` em vez de criar outro do zero. Qualquer script novo que precise de senha real segue o mesmo padrão `scripts/local-*` (nunca comitar) e a mesma abordagem via Admin API (nunca SQL direto em auth.users).
