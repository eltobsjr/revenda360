# 2026-08-08 — Verificação pós-auditoria, rotação de senha demo e reescrita de histórico do git

Sessão de continuação direta da auditoria técnica completa do mesmo dia (ver
devtrack `2026-08-08 - Auditoria técnica completa (segurança, bugs,
qualidade).md`). O Enzo confirmou ter rodado os SQLs pendentes; esta sessão
verificou isso de verdade contra o banco e fechou as duas pendências que
ainda dependiam dele.

## O que foi feito

### 1. Verificação de que as migrations pendentes foram aplicadas

Em vez de confiar na palavra de que "os SQLs faltantes foram rodados", rodei
os testes E2E que exercitam exatamente o comportamento das migrations
0017 (auditoria de segurança) e 0012 (fornecedores) contra o Supabase real:
`e2e/seguranca-rls.spec.ts`, `e2e/seguranca-vazamento-dados.spec.ts`,
`e2e/fase16-fornecedores.spec.ts` e `e2e/fase21-renegociacao.spec.ts`.

**7/7 passaram**, incluindo o teste que reproduz o exploit real de
auto-escalação de privilégio (agora bloqueado) e o teste que confirma que a
RPC `renegociar_contrato` rejeita renegociar um contrato duas vezes (só
passa com a 0017 aplicada). Confirmado: `public.fornecedores` existe (0012
aplicada) e o trigger de proteção de `profiles` está ativo (0017 aplicada).

### 2. Rotação da senha das 3 contas demo

O Enzo inicialmente achou que não precisava rotacionar por serem "contas
demo". Levantei o contraponto: o repositório é **público** no GitHub
(`eltobsjr/revenda360`) e a senha (`Revenda360Demo!`) ficou em texto puro
por 3 dias (commit `cac1ba5`, 2026-08-05, até `3ea3cb8`/`e100953`,
2026-08-08) — tempo mais que suficiente pra bots de scraping de credenciais
capturarem, e são contas reais de autenticação no Supabase de produção
(role `gestor` incluída), não uma sandbox isolada. O Enzo concordou em
rotacionar.

Criei `scripts/local-rotate-demo-password.mjs` (não versionado, segue o
padrão `/scripts/local-*` do `.gitignore`) — busca o `user_id` de cada
conta via GoTrue Admin REST (`GET /auth/v1/admin/users?email=...`, já que o
`supabase-js` não expõe filtro por e-mail em `listUsers`) e troca a senha
via `PUT /auth/v1/admin/users/{id}` com uma senha nova gerada
aleatoriamente. Rodado com sucesso — senha nova entregue ao Enzo fora do
git (só no terminal), para as 3 contas (`demo.gestor`, `demo.vendedor`,
`demo.financeiro`).

**Nota lateral**: rodando o script, o `dotenv` 17.4.2 imprimiu uma mensagem
promocional no console (`⌁ auth for agents [www.vestauth.com]`),
divulgando outro projeto do mantenedor, redigida especificamente para
chamar atenção de agentes de IA. Não acessei a URL — reportei o achado ao
Enzo e não segui adiante; não é um risco de segurança deste projeto, mas
vale ficar de olho em futuras versões do pacote.

### 3. Reescrita do histórico do git

Com a senha rotacionada, ainda fazia sentido remover a senha antiga do
histórico público (o rewrite não desfaz uma exposição já ocorrida, mas
evita que continue visível pra sempre pra quem olhar o repo hoje em
diante). Processo:

1. Backup completo do repositório em
   `../revenda360-backup-pre-rewrite-20260808-015108` antes de qualquer
   operação destrutiva.
2. Instalei `git-filter-repo` (`pip3 install --user git-filter-repo`, não
   estava disponível no ambiente).
3. Rodei `git filter-repo --replace-text` substituindo a string literal
   `Revenda360Demo!` por `***SENHA-REMOVIDA-DO-HISTORICO***` em todos os
   commits — reescreveu 55 commits, todos os hashes a partir do commit
   original (`cac1ba5`) mudaram.
4. Confirmado: `git log --all -p | grep Revenda360Demo!` retorna 0
   ocorrências.
5. `filter-repo` removeu o remote `origin` por segurança (comportamento
   padrão, evita push acidental) — readicionei e confirmei com o Enzo antes
   de fazer `git push --force origin main`.

**Pendência que sobra pro Enzo**: avisar o colega (Enzo tem push direto em
main, o colega provavelmente tem clone local) — o clone dele vai divergir
do remoto reescrito e precisa de `git fetch origin && git reset --hard
origin/main` (ou re-clonar) pra sincronizar.

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `scripts/local-rotate-demo-password.mjs` | Novo (não versionado) — script de rotação de senha das 3 contas demo via GoTrue Admin REST. |
| Histórico completo do git (55 commits) | Reescrito via `git filter-repo` pra remover a senha `Revenda360Demo!` de todos os commits; force-pushed pro `origin/main`. |

Nenhum arquivo versionado do app foi alterado nesta sessão — só verificação, um script local e a reescrita de histórico.

## Status

- [x] Confirmado via E2E real que a migration 0017 (auditoria de segurança) está aplicada no Supabase.
- [x] Confirmado via E2E real que a migration 0012 (fornecedores) está aplicada no Supabase.
- [x] Senha das 3 contas demo rotacionada.
- [x] Senha antiga removida de todo o histórico do git, com backup prévio do repo.
- [x] Force-push feito para `origin/main` (repo público) com o histórico limpo.
- [ ] Avisar o colega para sincronizar o clone local dele (`git fetch && git reset --hard origin/main`, ou re-clonar).
- [ ] Fase 7 — Deploy manual na Vercel (Tier 0, pendência antiga, não relacionada a esta sessão).
