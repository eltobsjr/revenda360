# Tier 2 pós-MVP: Fluxo de caixa, Comissões, DRE por veículo

Continuação da mesma sessão do Tier 1 (ver devtrack anterior no mesmo dia),
a pedido do Enzo ("Continue" após o relatório do Tier 1). Fecha o módulo
financeiro por completo.

## O que foi construído

### Fase 12 — Fluxo de caixa (commit `78a9c99`)
`/financeiro/fluxo-caixa` (gestor/financeiro): entradas (parcelas de
crediário pagas + pagamentos à vista de vendas confirmadas) x saídas (contas
a pagar pagas + custos de veículo lançados), por mês nos últimos 12 meses,
com saldo do mês e acumulado. Nova função de domínio pura
`agruparFluxoCaixaPorMes` (`lib/domain/fluxo-caixa.ts`, com testes),
seguindo o mesmo padrão de bucket-de-12-meses-com-zero-fill já usado no
Dashboard. Sem tabela nova — leitura agregada sobre Fases 4, 5 e 11.

### Fase 13 — Comissões (commit `34e8678`)
`/financeiro/comissoes` (100% gestor): comissão de vendas confirmadas
agrupada por vendedor num período (filtro de mês), expansível pra ver as
vendas individuais, com ação de marcar cada venda como paga.

**Decisão perguntada ao Enzo antes de implementar** (o guia exigia parar
aqui): campo simples `comissao_paga`/`comissao_data_pagamento` em `vendas`
em vez de tabela separada `comissoes_pagamentos` — confirmado por ele.
Migration `0010_fase13_comissoes.sql`.

### Fase 14 — DRE por veículo (commit `ce26288`)
`/financeiro/dre` (100% gestor, nem financeiro/vendedor veem): cada venda
confirmada no período é uma linha — preço de venda, custo de aquisição,
custos lançados, comissão, margem em R$ e %. Reaproveita exatamente a
fórmula de lucro do Dashboard (`custoTotal`/`margemPct` de
`lib/domain/pricing.ts`) em vez de reescrever. Sem migration.

## Pendência que precisa de você (Enzo)

**Uma migration nova, ainda não aplicada**: `supabase/migrations/0010_fase13_comissoes.sql`
— sem ela, `/financeiro/comissoes` quebra com "column vendas.comissao_paga
does not exist". As duas migrations do Tier 1 (0008 e 0009) você já aplicou
durante esta mesma sessão — confirmado rodando os e2e de novo, todos
passaram.

## Testes

- Typecheck, lint, build: limpos em todo commit.
- Unit (Vitest): 50/50 passando (4 novos testes de `agruparFluxoCaixaPorMes`).
- E2E (Playwright): 35 specs no total agora (3 novos: fase12, fase13,
  fase14). 34/35 passando — a única falha é a migration 0010 pendente
  acima, confirmado isolando a causa raiz.
- Um bug real encontrado e corrigido no meio do caminho: o teste e2e da
  Fase 9 (escrito na sessão anterior, quando a migration 0008 ainda não
  tinha sido aplicada) checava um campo antes de abrir a aba onde ele fica
  — só apareceu depois que a migration foi aplicada e o teste passou a
  rodar de verdade pela primeira vez. Corrigido (commit `5fc0262`).

## Estado do roadmap após esta sessão

Tier 0 (deploy), Tier 1 e Tier 2 prontos do lado do código. Tier 0 segue
esperando o deploy manual na Vercel. Tier 1 está 100% funcional (migrations
aplicadas). Tier 2 falta só a migration 0010. Próximo: Tier 3 (Consignados,
Fornecedores, Marcas/Modelos) quando o Enzo confirmar que quer seguir — tem
mais pontos de decisão de negócio nessas fases (ex.: consignação é
percentual ou valor fixo de comissão).
