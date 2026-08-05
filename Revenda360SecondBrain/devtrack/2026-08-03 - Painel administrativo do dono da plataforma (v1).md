# 2026-08-03 — Painel administrativo do dono da plataforma (v1)

Devtrack retroativo, reconstruído em 2026-08-05 a partir do commit `8e3051b` (autor: Enzo, `kenjizxst <enzimbenevides@gmail.com>`), pushado direto para `origin/main` sem passar por esta sessão do Claude Code. Resolve o item apontado como "maior buraco" no devtrack da Fase 6.

## O que foi feito

- **Migration `0007_admin_panel.sql`**:
  - Tabela `platform_admins` (allowlist `user_id`) — o dono da plataforma não pertence a nenhum tenant, então não pode ser uma linha em `profiles` (`tenant_id` é `NOT NULL` lá e toda a RLS multi-tenant assume isso). Sem policy de insert/update/delete: só quem tem acesso de service role (SQL Editor) gerencia essa tabela diretamente.
  - Função `is_platform_admin()` (`security definer`, `stable`).
  - Policy `tenants_select_platform_admin`: permite ao platform admin listar todos os tenants (tela `/admin`).
  - RPC `provisionar_revenda()`: variante de `onboarding_criar_tenant` + `criar_membro_equipe` — recebe o usuário-alvo já criado via Admin API (em vez de `auth.uid()`), gate de autorização é `is_platform_admin()`. Cria tenant + `tenant_config` + loja + profile (`role: gestor`) numa RPC só.
  - Remove `onboarding_criar_tenant`, sem uso desde a remoção do autocadastro público (2026-08-01).
- **`app/admin/`**: layout com guard (`requirePlatformAdmin`, redireciona pra `/login` se falhar), listagem de revendas (somente leitura) em `/admin`, formulário de nova revenda em `/admin/revendas/nova` — mesmo padrão de dois passos já validado na tela de Equipe (Admin API cria o `auth.users`, RPC `security definer` insere o resto).
- **Roteamento do dono da plataforma**: `lib/supabase/middleware.ts` e `app/(auth)/actions.ts` passam a distinguir, para um usuário autenticado sem `profile`, "dono da plataforma" (`is_platform_admin()` true → manda pra `/admin`) de "JWT órfão" (profile deletado/nunca criado → desloga, evita o loop de redirecionamento já resolvido na Fase 1).
- **`next.config.ts`**: `turbopack.root` explícito — lockfiles soltos fora do diretório do projeto (duplicata de pasta na máquina do Enzo) confundiam a detecção automática de workspace root do Turbopack.
- Testes: `e2e/admin-panel.spec.ts` + helper `seedPlatformAdmin()` em `e2e/helpers/admin.ts`.

## Pendência operacional

A migration `0007_admin_panel.sql` ainda precisa ser aplicada manualmente no SQL Editor do Supabase (sem CLI conectada — mesmo processo de sempre). Além disso, como não há policy de insert em `platform_admins`, a primeira linha (o próprio dono da plataforma) só pode ser inserida por SQL direto no editor — não existe fluxo de UI para isso, propositalmente.

## Nota do autor do commit (Enzo)

`npm run build` apresentou, no ambiente dele, `Invariant: Expected workStore to be initialized` em `/financeiro/receber` e `/estoque/avaliacao-troca`, sinalizada como pré-existente e não relacionada a esta mudança. **Auditoria em 2026-08-05**: `npm run build`, `npm run lint` e `tsc --noEmit` rodam limpos neste ambiente — não reproduziu. Suspeita: efeito colateral do próprio problema de `turbopack.root` (lockfiles duplicados fora da pasta do projeto) já corrigido neste mesmo commit, específico da máquina dele.

## Auditoria (2026-08-05)

- Commit não estava em `origin/main` quando puxado por fast-forward (`314ea13..8e3051b`) — sem conflito, sem divergência de branch.
- `criarRevenda` (`app/admin/revendas/nova/actions.ts`) segue exatamente o padrão de `criarMembroEquipe` (`app/(app)/equipe/actions.ts`), incluindo o mesmo comportamento em caso de falha do RPC após o `auth.users` já ter sido criado (usuário órfão sem profile, sem rollback automático) — não é uma regressão, é a mesma característica já aceita no fluxo de Equipe.
- Gate de autorização (`is_platform_admin()` checado tanto na RPC quanto em `requirePlatformAdmin()` no server action) consistente com o resto do projeto.
- Nenhum bug novo encontrado.
