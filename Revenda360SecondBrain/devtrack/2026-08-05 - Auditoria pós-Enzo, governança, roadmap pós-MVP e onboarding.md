# 2026-08-05 — Auditoria pós-Enzo, governança, roadmap pós-MVP e onboarding do Enzo

Sessão iniciada com o pedido "veja se houveram mudanças no sistema, atualize
a minha cópia, audite toda essa mudança e me fale oque mudou". Acabou virando
uma sessão grande: auditoria de código, reconciliação de regras de
governança, definição de roadmap pós-MVP completo, e onboarding prático do
Enzo pra continuar construindo sozinho com o próprio Claude Code dele.

## O que foi feito

### 1. Descoberta: commit do Enzo no remoto, não sincronizado local

`git fetch` revelou que `origin/main` estava 1 commit à frente do local:
`8e3051b` — "Painel administrativo do dono da plataforma (v1)", autor real
**Enzo** (`kenjizxst <enzimbenevides@gmail.com>`), pushado direto sem passar
por uma sessão de Claude Code observada. Trouxe pro local via
`git merge --ff-only` (sem conflito — única branch remota é `main`).

Isso revelou que o Enzo não é só stakeholder de negócio: ele tem **push
direto em `main`** e já constrói fase sozinho. Memória `project_tools.md`
atualizada pra refletir isso — sessões futuras devem sempre `git fetch` e
checar commit dele não auditado.

### 2. Auditoria de 3 commits

Além do commit do Enzo, dois commits de 2026-08-03 (`1573e8a` "Fix QA
pós-MVP", `82f9d1e` "Fix 9 bugs reais") nunca tinham ganhado devtrack.
Revisão de diff completo (não só mensagem de commit) dos três:

- **QA pós-MVP (11 bugs no total)**: normalização de meia-noite em
  `calcularDiasAtraso`/`diasEstoque`, campos financeiros opcionais na ficha,
  arredondamento de centavos em `gerarParcelas`, `dataIsoLocal` (bug de
  timezone gravando dia errado depois das ~21h), corrida em dupla baixa de
  parcela, agrupamento de inadimplência por `cliente_id` em vez de nome
  (homônimo), vazamento de custo de aquisição pro vendedor no Dashboard,
  busca com vírgula/parênteses quebrando `.or()` do PostgREST, campos
  sensíveis sendo zerados ao editar veículo como não-gestor, loop infinito em
  `MidiaTab`. Todas as correções batem com os problemas descritos — nenhum
  bug novo encontrado.
- **Painel administrativo (Enzo)**: migration `0007_admin_panel.sql`
  (`platform_admins`, `is_platform_admin()`, RPC `provisionar_revenda`),
  `app/admin/`, roteamento de middleware pro dono da plataforma. `criarRevenda`
  segue fielmente o padrão já existente de `criarMembroEquipe` (mesmo
  comportamento de usuário órfão se a RPC falhar depois do `auth.users` criado
  — não é regressão, é característica já aceita). `npm run build`/`lint`/
  `tsc --noEmit` rodaram limpos — a falha de build que o Enzo sinalizou como
  "pré-existente, investigar à parte" não reproduziu neste ambiente (suspeita:
  já resolvida pelo próprio fix de `turbopack.root` incluído no commit dele).

Devtracks retroativos escritos pros dois commits sem registro:
`2026-08-03 - QA pós-MVP (correção de 11 bugs reais).md` e
`2026-08-03 - Painel administrativo do dono da plataforma (v1).md`.
`prioridade/atual.md` atualizado (painel administrativo: pendente → concluído
v1).

### 3. Reconciliação da regra de commit

`CLAUDE.md` ainda dizia "nunca commitar sem permissão explícita", mas
`prioridade/atual.md` já registrava desde 2026-08-01 (nota do usuário,
nunca reconciliada) que a regra tinha mudado pra "termina fase → commita →
pusha". Usuário confirmou explicitamente em 2026-08-05: pode commitar sem
pedir permissão, **desde que passe por verificação obrigatória (typecheck +
lint + build) e testes automáticos antes**. `CLAUDE.md` (seção 5) e a memória
`feedback_rules.md` atualizados e reconciliados.

### 4. Regra suprema de segurança de dados

Usuário pediu explicitamente uma "regra suprema" de segurança, logo depois de
liberar a autonomia de commit — sinal de que a autonomia não deveria virar
"vale tudo". `CLAUDE.md` ganhou uma seção 0, antes de qualquer outra regra:
segurança de dados vence velocidade; RLS nasce junto com a tabela na mesma
migration; dado sensível sempre filtrado em `lib/data/*`; segredo nunca vai
pro git; **a autonomia de commit da seção 5 não vale se a mudança tocar
segurança** (RLS, auth, autorização, exposição de dado sensível, segredo) —
nesses casos, parar e descrever antes de commitar, mesmo com testes verdes.
Memória nova: `feedback_seguranca_dados.md`. O bloco de regras embutido em
`guia-construcao-enzo.md` (ver item 6) também foi atualizado pra reforçar
essa regra suprema em todo prompt.

### 5. Conta de dono da plataforma provisionada

Usuário pediu inicialmente um SQL de bootstrap pra inserir a primeira linha
em `platform_admins`. Depois pediu pra virar um "seed" completo (apagar conta
antiga com o e-mail + criar do zero com senha). Como isso significaria INSERT
direto em `auth.users`/`auth.identities` (schema interno frágil entre
versões do Supabase — nenhum outro lugar do projeto faz isso, tudo usa Admin
API), perguntei ao usuário e ele confirmou preferir a abordagem seguindo o
padrão já existente. Resultado: `scripts/local-seed-platform-admin.mjs`
(não versionado — `.gitignore: /scripts/local-*`, padrão novo criado
especificamente pra isso), usando `admin.auth.admin.createUser` (mesmo
mecanismo de `criarMembroEquipe`/`criarRevenda`/`e2e/helpers/admin.ts`).
Rodado com sucesso: conta `eltobsjr@gmail.com` criada e registrada em
`platform_admins`.

### 6. Levantamento de telas faltantes + ordem de prioridade

Auditoria do código (`app/(app)/**/page.tsx`) encontrou **13 telas ainda são
stub** (`StubScreen`, 5 linhas cada): Vendas realizadas, Fornecedores,
Marcas/Modelos, Consignados, Avaliação/Troca, Contas a pagar, DRE, Fluxo de
caixa, Comissões, Configurações, Relatórios, Leads, Propostas — mais duas
funcionalidades parciais (Clientes sem ficha completa, Renegociação de
contrato só como toast). Ordem de prioridade definida com o usuário, em 6
tiers (do que bloqueia vender pra qualquer revenda real até a cauda longa) —
gravada em `prioridade/atual.md`:

- **Tier 0**: Deploy/CI.
- **Tier 1**: Vendas realizadas, Avaliação/Troca, Clientes completo, Contas a
  pagar.
- **Tier 2**: Fluxo de caixa, Comissões, DRE por veículo.
- **Tier 3**: Consignados, Fornecedores, Marcas/Modelos.
- **Tier 4**: Régua de cobrança automatizada, Leads (CRM kanban), Propostas,
  Renegociação de contrato.
- **Tier 5**: Relatórios/PDF, Configurações da loja, Permissões avançadas,
  Integrações reais, PWA, Billing do SaaS, SMTP próprio.

### 7. Guia de construção fase a fase pro Enzo

Usuário pediu um arquivo com prompt específico por fase, pro Enzo (que não
programa) seguir sozinho com o Claude Code dele. Criado
`Revenda360SecondBrain/prioridade/guia-construcao-enzo.md`: instruções de uso
não-técnicas, um prompt pronto por fase (Fase 7 a 28, contínuo da numeração
Fase 0-6 já usada), cada prompt grounded no schema/código real (referencia
arquivo concreto a seguir como padrão, já aponta onde precisa de migration
nova) e instrui o Claude a **parar e perguntar** quando a decisão é de
negócio (modelo de comissão, biblioteca de PDF, gateway de pagamento, enum de
etapas do kanban de leads) em vez de inventar. Todo prompt embute o mesmo
bloco de regras fixas do projeto (incluindo a regra suprema de segurança) e
termina com um checklist de teste manual não-técnico.

### 8. Tenant de demonstração + guia de teste

Usuário pediu logins de teste reais (não mock) pra testar agora e apresentar
a clientes depois. Criado `scripts/local-seed-demo-tenant.mjs` (mesmo padrão
não-versionado do item 5): tenant "Revenda Demo", 3 contas
(gestor/vendedor/financeiro), 6 veículos, 2 clientes, 2 vendas (1 à vista, 1
em crediário com 4 parcelas em estados variados — paga/atrasada/a vencer).
Rodado com sucesso. Guia de teste criado:
`Revenda360SecondBrain/guia-teste-funcionalidades.md` — roteiro por role do
que já está construído (Fases 0-6 + painel admin), separado do guia de
construção (que é sobre o que falta).

### 9. Pergunta técnica: `NEXT_PUBLIC_SITE_URL`

Usuário perguntou se essa variável deve ser `localhost` ou a URL da Vercel em
produção. Resposta: a URL real de produção (`https://<projeto>.vercel.app`),
nunca localhost. Achado adicional: a variável hoje não é referenciada em
nenhum lugar do código (só existia pra montar link de confirmação de e-mail
do cadastro público, removido do projeto) — tecnicamente pode ficar vazia.

### 10. Mensagens ao Enzo via WhatsApp

Usuário pediu pra mandar mensagem pro Enzo com: panorama do que o sistema
faz, os logins de teste, o guia de teste, e um prompt de continuidade
apontando pros guias + lembrete de dar `git pull`. Duas mensagens enviadas
com sucesso. No meio do caminho, problema real de contato: a memória tinha o
número do Enzo com 8 dígitos depois do DDD; `get_direct_chat_by_contact` e
`search_contacts` não acharam nada (só "Antônio Enzo", o homônimo errado já
registrado em memória desde 2026-08-03); pedi confirmação ao usuário, ele
disse "com o 9" — tentativa com 9 dígitos falhou de verdade
(`send_message` retornou erro "no LID found", número sem conta ativa);
voltei pra versão de 8 dígitos (a original) e funcionou. Memória
`project_contato_enzo.md` corrigida com o número certo confirmado por envio
real bem-sucedido, não só por confirmação verbal.

## Decisões registradas

- Regra de commit sem permissão explícita, condicionada a verificação +
  testes automáticos limpos — substitui definitivamente a regra antiga,
  reconciliando `CLAUDE.md` com o que já estava (não reconciliado) em
  `prioridade/atual.md` desde 2026-08-01.
- Regra suprema: segurança de dados vence velocidade e vence a própria
  autonomia de commit — mudança que toca RLS/auth/dado sensível/segredo
  sempre para pra confirmação, mesmo com testes verdes.
- Criação de usuário real (senha) sempre via Admin API (`auth.admin.createUser`),
  nunca INSERT direto em `auth.users`/`auth.identities` — schema interno
  frágil, e é o único padrão consistente com o resto do projeto.
- Qualquer script local de execução única com segredo embutido vive em
  `scripts/local-*`, nunca versionado.
- Enzo tem push direto em `main` e constrói fase sozinho com o Claude Code
  dele — sessões futuras devem checar commit dele não auditado a cada
  `git fetch`.
- Ordem de prioridade dos 22 itens pós-MVP definida em 6 tiers (ver item 6
  acima) — substitui a lista sem ordem que existia antes em
  `prioridade/atual.md`.

## Commits desta sessão

`c073f3b`, `b4a2ab8`, `4a3b4ad`, `97eab50`, `cac1ba5` — todos em `main`,
todos passaram por typecheck + lint + build + testes antes de commitar
(regra nova do item 3).

## Pendências abertas

- Enzo precisa dar `git pull origin main` (mensagem já mandada) e começar
  pela Fase 7 (Deploy/CI) — é o item que bloqueia colocar o produto na frente
  de qualquer cliente real.
- Deploy em si (conta Vercel, env vars) é passo manual do Enzo, fora do
  alcance do Claude Code — documentado no prompt da Fase 7 do guia de
  construção.
- Confirmar que as duas mensagens de WhatsApp chegaram certas pro Enzo (não
  há como o assistente confirmar leitura, só envio).
