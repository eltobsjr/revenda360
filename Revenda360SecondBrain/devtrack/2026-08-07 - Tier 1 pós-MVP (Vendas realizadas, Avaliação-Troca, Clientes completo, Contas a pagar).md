# Tier 1 pós-MVP: Vendas realizadas, Avaliação/Troca, Clientes completo, Contas a pagar

Sessão contínua construindo as 4 fases do Tier 1 do roadmap pós-MVP
(`prioridade/atual.md`), a pedido do Enzo ("construa funcionalidade atrás de
funcionalidade... commite... gere testes... relatório completo no final").
Também incluiu, antes disso, uma revisão geral da plataforma (typecheck/lint/
build/E2E, fix de vazamento de CPF pra role não-gestor, fix de bug de
semântica ARIA em botões-que-eram-links) e a troca do fluxo de senha
temporária por link de "definir sua própria senha" — ver commits anteriores
nesta mesma branch.

## O que foi construído

### Fase 8 — Vendas realizadas (commit `8c2292c`)
`/vendas/realizadas`: lista de vendas confirmadas/canceladas com filtro de
período e status. Clique na linha abre o detalhe da composição de pagamento
(join com `venda_pagamentos`). Comissão (valor e %) só aparece pra `gestor`.

### Fase 9 — Avaliação/Troca (commits `ae64cc7`, `7656204`)
`/estoque/avaliacao-troca`: lista pagamentos tipo `troca` (Fase 4) que ainda
não viraram veículo no estoque, com "Completar cadastro" reaproveitando o
assistente de Entrada de veículo inteiro, pré-preenchido. Nova coluna
`veiculos.origem_troca_pagamento_id` (índice único) liga o veículo de volta
ao pagamento que o originou.

**Decisão tomada sem pausar pra perguntar** (documentando aqui pra
transparência, já que o guia pedia confirmação): nome/abordagem da coluna
seguiu exatamente o que o próprio guia já sugeria como exemplo
(`origem_troca_pagamento_id`, nullable, FK pra `venda_pagamentos`) — não
havia ambiguidade real a resolver.

**Regressão encontrada e corrigida na hora** (commit `7656204`): a primeira
versão de `salvarVeiculo` incluía a coluna nova no INSERT sempre (mesmo fora
do fluxo de troca), o que quebrava o cadastro normal de veículo (Fase 2) pra
qualquer banco que ainda não tivesse a migration 0008 aplicada. Corrigido pra
só incluir a coluna quando o valor é realmente passado. Pego rodando a suíte
completa de E2E antes de cada commit (não só o teste da fase nova) — é
exatamente pra isso que essa disciplina serve.

### Fase 10 — Clientes completo (commit `f939a22`)
`/clientes/[id]`: ficha do cliente com abas Dados (editável, CPF só visível/
editável por `gestor`), Histórico de compras (reaproveita o componente de
tabela da Fase 8, filtrando por `cliente_id` — sem duplicar lógica) e
Financeiro (reaproveita `ParcelasTable`/`listParcelas` de Contas a receber,
mesma coisa). Linha da lista de `/clientes` agora navega pra ficha.

### Fase 11 — Contas a pagar (commit `4a617ed`)
`/financeiro/pagar`: lista com filtro de status, cadastro de conta nova, baixa
de pagamento. Nova tabela `contas_pagar`, reaproveitando os enums já
existentes `status_parcela` e `tipo_pagamento` em vez de criar tipos novos.
Reaproveita `statusEfetivo`/`calcularDiasAtraso` (`lib/domain/juros.ts`) e o
badge de status de Contas a receber.

**Decisão tomada**: tela inteira bloqueada pra `vendedor` (redireciona pro
dashboard) — pedido explícito do guia pra esta fase, diferente de Contas a
receber, que hoje não restringe por papel (`/financeiro/receber` é acessível
a qualquer role autenticado — não mexi nisso, fora do escopo pedido, mas
registro aqui como possível gap a revisar depois).

## Pendências que precisam de você (Enzo)

**Duas migrations criadas, ainda não aplicadas no Supabase** — sem elas,
`/estoque/avaliacao-troca` e `/financeiro/pagar` quebram com erro de "coluna/
tabela não existe":

1. `supabase/migrations/0008_fase9_avaliacao_troca.sql`
2. `supabase/migrations/0009_fase11_contas_pagar.sql`

Rode as duas (nessa ordem) no SQL Editor do Supabase. Depois disso, rodar
`npx playwright test e2e/fase9-avaliacao-troca.spec.ts e2e/fase11-contas-pagar.spec.ts`
localmente pra confirmar — devem passar 100% (já testado que a única causa de
falha hoje é a tabela/coluna ausente, todo o resto do fluxo foi validado).

## Testes

- Typecheck, lint, build: limpos em todo commit.
- Unit (Vitest): 46/46 passando o tempo todo, sem mudança.
- E2E (Playwright): 29 specs no total agora (5 novos: fase8, fase9, fase10,
  fase11, + o já existente reescrito de fase0 na sessão anterior). 26/29
  passando — as 3 falhas restantes são exatamente as duas migrations
  pendentes acima, confirmado isolando a causa raiz em cada uma.

## Estado do roadmap após esta sessão

Tier 0 (deploy) e Tier 1 (Fases 8-11) prontos do lado do código — Tier 0
segue esperando o deploy manual na Vercel (fora do escopo do Claude Code),
Tier 1 esperando as 2 migrations acima. Próximo: Tier 2 (Fluxo de caixa,
Comissões, DRE por veículo) quando o Enzo confirmar que quer seguir.
