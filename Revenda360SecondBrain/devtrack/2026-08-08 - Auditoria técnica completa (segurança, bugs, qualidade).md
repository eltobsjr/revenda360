# Auditoria técnica completa — 2026-08-08

Auditoria profunda pedida pelo Enzo, cobrindo segurança, bugs funcionais,
qualidade de código, dependências e testes, em toda a aplicação. Usei 4
agentes de investigação em paralelo (lib/data, server actions/IDOR, RLS de
todas as migrations, autenticação/secrets/config) mais um agente dedicado a
bugs funcionais — cada achado relevante foi verificado diretamente por mim
antes de qualquer correção (rodando o exploit de verdade contra o banco,
lendo a migration exata, etc.), não apliquei nada só porque um agente
relatou.

## Achado crítico de segurança — auto-escalação de privilégio em `profiles`

**A policy `profiles_update_self` (migration 0001) só restringia QUAL linha
podia ser editada (`id = auth.uid()`), não QUAIS colunas.** Sem `WITH
CHECK` explícito, o Postgres reaproveita o `USING` como `WITH CHECK` — e
como `id` não muda num update, qualquer alteração passava, inclusive
`role` e `tenant_id`.

Verifiquei o exploit de verdade contra o banco de produção (script
descartável, sem tocar em dados reais): logado como `vendedor` usando só a
anon key (exatamente o que o navegador usa), rodei
`supabase.from('profiles').update({role: 'gestor'}).eq('id', meuId)` — **a
atualização passou sem erro nenhum.** Isso dá a qualquer vendedor acesso
imediato a tudo que depende de `current_role() = 'gestor'`: preço mínimo,
custo de aquisição, comissão, CPF completo, configuração do tenant, marcar
comissão como paga, etc. — contornando 100% das checagens do Next.js
(`requireProfile`/`requireRole`), porque acontece direto no banco.

**Correção diferente do que o agente sugeriu**: também testei trocar
`tenant_id` pra sequestrar outro tenant, e essa parte **já estava bloqueada
por acidente** (uma interação entre a policy de SELECT e o cache de função
`stable` do Postgres — não documentada, não confiável). A `role` não tinha
proteção nenhuma.

**Migration `0017_auditoria_seguranca_2026-08-08.sql`** — trigger
`BEFORE UPDATE` em `profiles` que bloqueia mudança de `id`/`role`/
`tenant_id`, com bypass só pra `service_role` (scripts administrativos
legítimos, nunca o browser). **Ainda não aplicada — precisa rodar no SQL
Editor do Supabase o quanto antes, é uma vulnerabilidade ativa.**

Teste de regressão: `e2e/seguranca-rls.spec.ts` — reproduz o exploit de
verdade (login como vendedor com a anon key, tenta o UPDATE direto) e
falha hoje exatamente porque o ataque ainda funciona; vai passar assim que
a migration rodar.

## Outros achados de segurança corrigidos na mesma migration

- **`profiles.ativo` nunca era checado** em `current_tenant_id()`/
  `current_role()` — "desativar" um membro não revogava acesso nenhum via
  RLS. Corrigido (funções redefinidas com `and ativo = true`).
- **`fechar_venda`/`renegociar_contrato`** concediam `EXECUTE` só pra
  `authenticated` sem revogar de `public`/`anon` antes (padrão inconsistente
  com o resto do projeto) — corrigido.
- **`fechar_venda` não validava** que `cliente_id`/`vendedor_id` do payload
  pertencem ao tenant do chamador (só `veiculo_id` era validado) — servia
  de oráculo pra confirmar UUIDs de clientes/vendedores de outros tenants
  por tentativa e erro. Corrigido.

## Vazamento de dados sensíveis corrigido em `lib/data/*`

Vários dados financeiros internos (custo de aquisição, margem, comissão,
repasse de consignação) eram protegidos só por `redirect()` na página ou
por ocultação no componente visual — o próprio CLAUDE.md do projeto proíbe
isso ("filtrado em lib/data/*, nunca só escondido no componente"). Corrigi
adicionando o parâmetro `role` e filtrando na origem, seguindo o padrão já
usado em `lib/data/veiculos.ts`/`clientes.ts`:

- `lib/data/avaliacao-troca.ts` — valor da troca (= custo de aquisição do
  veículo recebido) aparecia pra qualquer role em `/estoque/avaliacao-troca`,
  tela em produção. **Era o achado mais concreto**: qualquer vendedor logado
  via essa tela via o valor de compra de todo veículo recebido em troca.
  Teste de regressão: `e2e/seguranca-vazamento-dados.spec.ts`.
- `lib/data/tenant.ts` — `margem_minima_pct_default` ia sem filtro pro
  bundle client de Nova venda (mitigado na prática porque os dados de custo
  já eram filtrados à parte, mas ainda assim corrigido).
- `lib/data/dre.ts`, `lib/data/comissoes.ts` — DRE e Comissões completos,
  agora com `role` como parâmetro (retornam `[]` pra não-gestor).
- `lib/data/consignacoes.ts` — repasse/comissão de revenda agora `number |
  null`, só preenchido pra gestor.
- `lib/data/contas-pagar.ts`, `lib/data/fluxo-caixa.ts` — mesmo padrão,
  bloqueados pra vendedor.

## Defesa em profundidade — `tenant_id` explícito em `actions.ts`

Praticamente todo UPDATE/DELETE por `id` nas Server Actions confiava só no
RLS (que confirmei estar correto, tabela por tabela, nas 16 migrations
existentes) sem filtro de `tenant_id` no próprio código. Não é IDOR
explorável hoje, mas é a única camada de defesa — se o RLS tiver qualquer
regressão futura, cada uma dessas vira IDOR real sem aviso. Adicionei
`.eq("tenant_id", profile.tenantId)` em: `clientes`, `estoque` (veículos,
fotos, custos), `fornecedores`, `marcas-modelos`, `leads`, `propostas`,
`financeiro/pagar`, `financeiro/comissoes`, `financeiro/receber`.

## Bug funcional crítico — renegociação de contrato causava dívida em dobro

Achado pelo agente de bugs, verificado e corrigido: `renegociar_contrato`
não checava se o contrato ainda estava `'Ativo'` antes de renegociar de
novo, e a leitura (`lib/data/contas-receber.ts`) nunca filtrava contratos
`'Renegociado'` nem parcelas `'Renegociada'` fora da lista de "em aberto".
Isso causava, na prática:

1. Dashboard somava a dívida do contrato antigo (parcelas 'Renegociada')
   **junto com** o carnê novo no KPI "A receber" — valor inflado, usado em
   decisão financeira.
2. A parcela antiga continuava com botão "Dar baixa" funcional em Contas a
   receber → Por parcela — clicar registrava um recebimento sobre uma
   dívida que já não existia mais como tal.
3. O contrato antigo reaparecia em Por contrato com "Renegociar"
   disponível de novo, permitindo renegociar em cascata o mesmo débito.

**Correções**:
- `supabase/migrations/0017_...sql` — RPC `renegociar_contrato` agora
  rejeita renegociar um contrato que não está mais `'Ativo'`.
- `lib/data/contas-receber.ts` — `carregarContratosBase()` exclui
  contratos `'Renegociado'` (efeito cascata: some da grid "Por contrato" E
  da lista "Por parcela" E do cálculo do Dashboard, que reusa
  `listParcelas()`), e `podeBaixar` também exclui status `'Renegociada'`
  como camada redundante.
- `app/(app)/financeiro/receber/actions.ts` — `darBaixaParcela` bloqueia
  explicitamente parcela com status `'Renegociada'` (fora do caminho de
  `listParcelas`, então precisava do próprio guard).

Teste de regressão: estendi `e2e/fase21-renegociacao.spec.ts` — confirma
que só o carnê novo oferece "Renegociar", que a parcela antiga some da
visão "Por parcela", e que a RPC rejeita renegociar duas vezes (esse
último ainda depende da migration 0017, falha até ela ser aplicada).

## Outros bugs funcionais corrigidos

- **Erros de conversão lead/proposta → venda descartados silenciosamente**
  (`components/features/leads/leads-board.tsx`,
  `components/features/propostas/proposta-acoes.tsx`): se
  `converterLeadEmVenda`/`converterPropostaEmVenda` falhassem, o clique não
  fazia nada, sem mensagem — vendedor sem saber que precisa tentar de novo.
  Corrigido com exibição inline do erro (mesmo padrão já usado no
  rollback de drag-and-drop dos leads).
- **Desconto de baixa de parcela sem limite superior**
  (`app/(app)/financeiro/receber/actions.ts`): digitar um desconto maior
  que a dívida zerava o valor a receber mas gravava `desconto_aplicado`
  com o número exagerado. Corrigido com clamp no valor persistido.

## Robustez — error boundary ausente em todo o app

Não existia **nenhum** `error.tsx` em nenhuma rota — qualquer exceção não
tratada em qualquer Server Component quebrava a tela inteira sem fallback
(o overlay genérico do Next em dev, algo pior/sem estilo em produção).
Adicionado `app/error.tsx` (Next.js 16.3 usa a prop `retry`, não `reset` —
conferido direto no doc do pacote antes de escrever, é uma mudança de API
do Next 16 que quebraria silenciosamente se eu tivesse usado o padrão
antigo). Cobre toda a árvore de rotas abaixo do layout raiz.

## Headers de segurança e hardening adicional

- `next.config.ts` — adicionado CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  e `Strict-Transport-Security`. CSP libera `unsafe-eval` só em dev (React
  dev mode precisa, produção não).
- `app/auth/confirm/route.ts` — parâmetro `next` da URL agora só aceita
  path interno (`/algo`), nunca `//evil.com` nem URL absoluta — esse
  endpoint resolve o link de "definir senha", então um open redirect ali
  seria sensível.
- `.env.example` — comentário reforçando que `NEXT_PUBLIC_SITE_URL` é
  obrigatório em produção (sem ela, o link de definir senha é montado a
  partir do header `Host` da requisição, que pode não ser confiável
  dependendo do proxy na frente).

## Credencial exposta no repositório

`Revenda360SecondBrain/guia-teste-funcionalidades.md` tinha a senha em
texto puro das 3 contas de demonstração (`demo.gestor@...`,
`demo.vendedor@...`, `demo.financeiro@...`), commitada desde 2026-08-05
(`cac1ba5`), num repositório já pushado pro GitHub
(`github.com/eltobsjr/revenda360`, público ou privado — não sei o
visibility). **Removida do arquivo atual** — mas **continua no histórico
do git** (não reescrevi histórico, é uma operação destrutiva que exige
autorização explícita sua). **Recomendo fortemente rotacionar a senha
dessas 3 contas** — são contas reais do projeto Supabase de produção
(`xjpmpvxxwsmegpnukuqs.supabase.co`), não um ambiente de teste isolado.

## Dependências

`npm audit` encontrou 5 vulnerabilidades (1 moderada, 4 altas): `hono`/
`nanoid` (transitivas do `shadcn` CLI, nunca rodam em produção — mas
`shadcn` estava incorretamente em `dependencies`, movido pra
`devDependencies`), e `postcss`/`sharp` (transitivas do `next`, corrigidas
atualizando `next` 16.2.12 → **16.3.0**, testado com typecheck/lint/build/
E2E completos depois do bump). **`npm audit` agora: 0 vulnerabilidades.**

## Testes

- Unit (Vitest): 50/50 antes e depois — nenhuma regressão, nenhum teste
  nesse nível precisou mudar.
- E2E (Playwright): 43 → 47 specs (4 novos: 2 em `seguranca-rls.spec.ts`,
  1 em `seguranca-vazamento-dados.spec.ts`, 1 estendendo
  `fase21-renegociacao.spec.ts`). Ver números finais na seção de validação
  do relatório enviado ao Enzo.
- Typecheck, lint, build: limpos em todo commit.

## Pendências que dependem do Enzo

1. **Rodar `supabase/migrations/0017_auditoria_seguranca_2026-08-08.sql`**
   no SQL Editor — crítico, corrige a auto-escalação de privilégio ativa.
2. **Rodar `supabase/migrations/0012_fase16_fornecedores.sql`** — ainda
   pendente de sessões anteriores, não relacionada a esta auditoria.
3. **Rotacionar a senha das 3 contas demo** (`demo.gestor`, `demo.vendedor`,
   `demo.financeiro`) — vazou no histórico do git.
4. Decidir se quer reescrever o histórico do git pra remover a senha de
   vez (operação destrutiva, não fiz sem autorização explícita).
