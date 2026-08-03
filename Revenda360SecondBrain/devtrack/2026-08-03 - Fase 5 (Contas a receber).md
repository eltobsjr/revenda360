# 2026-08-03 — Fase 5 (Contas a receber)

## O que foi feito

- Reli a tela "Contas a receber" no protótipo (`Revenda360.dc.html`, `computeReceber`/`confirmarBaixa`) antes de implementar. Achados-chave:
  - 3 visões: **Por parcela** (tabela com filtro de status + botão "Dar baixa"), **Por contrato** (cards com barra de progresso pago/saldo), **Inadimplência** (agrupado por cliente, com faixa de atraso: 1–15/16–30/31–60/+60 dias).
  - Fórmula de juros + multa do protótipo (hardcoded): `juros = valor*0.02 + valor*0.001*diasAtraso` — bate exatamente com os defaults de `tenant_config` (`multa_pct=2`, `mora_pct_dia=0.1`), então virou `calcularJurosMulta(valor, diasAtraso, multaPct, moraPctDia)` parametrizado por tenant em `lib/domain/juros.ts`, com `calcularDiasAtraso` e `statusEfetivo` como funções irmãs.
  - **Bug real encontrado no protótipo**: o modal de baixa mostra "Valor a receber" = `valor + juros - desconto`, mas `confirmarBaixa` só gravava `pago = valor - desconto` — os juros calculados na tela nunca eram persistidos. Corrigido na implementação real: `valor_pago = max(0, valor + juros - desconto)`, que é a intenção óbvia do fluxo (o modal não faria sentido mostrando um total que não é o que se recebe).
  - Status `Parcial` existe no enum mas nenhum fluxo do protótipo o gera (`confirmarBaixa` sempre fecha a parcela inteira, nunca baixa parcial) — mantido no tipo por compatibilidade futura, mas a baixa real implementada também sempre quita 100% da parcela, igual ao protótipo de fato (não ao que o enum sugere).
- **Sem tabelas novas**: `contratos_crediario`/`parcelas` já existiam desde a Fase 4. Migration `0006_fase5_contas_receber.sql` só adiciona `parcelas.forma_pagamento` (reaproveita o enum `tipo_pagamento` da Fase 4, restrito a dinheiro/pix/cartão/transferência na validação/UI) — campo que o protótipo mostrava no modal mas nunca persistia (mesma classe de bug do juros).
- **Status "Atrasada" nunca é persistido** — decisão deliberada, documentada em `lib/domain/juros.ts` (`statusEfetivo`): sem cron/job no projeto, uma parcela `A vencer` com vencimento passado é tratada como `Atrasada` só em tempo de leitura. Isso simplifica bastante a Fase 5 (não precisa de nenhum job agendado) às custas de não ter o status "congelado" gravado — aceitável porque todo lugar que lê parcela usa `statusEfetivo`.
- `lib/data/contas-receber.ts`: em vez de `select` com embed aninhado de 2 níveis (`parcelas → contratos_crediario → clientes/veiculos/vendas`), resolvi nomes de cliente/veículo com consultas `.in(ids)` separadas e juntei em JS. Mais simples de tipar corretamente contra `types/database.types.ts` (escrito à mão, sem os relacionamentos profundos que o Supabase geraria automaticamente) e o volume de contratos de uma revenda não justifica a otimização de um único round-trip.
- Server Action `darBaixaParcela` (padrão `useActionState`, igual `criarCliente` da Fase 3): recalcula juros/dias no servidor (nunca confia no valor mostrado no client), grava com guarda `.neq("status", "Paga")` para baixa dupla ser no-op em vez de duplicar recebimento.
- UI em `components/features/financeiro/receber/`: badge de status com as mesmas cores semânticas do Estoque (`success`/`info`/`destructive`/`warning`/`muted`), tabs de modo via `<Link>` (navegação por `searchParams`, mesmo padrão server-driven da tela de Clientes — sem Tabs client-side aqui), dialog de baixa com preview de juros/valor final recalculado no client conforme o desconto é digitado.

### Decisões de escopo (simplificações deliberadas)

- **Sem botão "Renegociar" funcional**: no protótipo, o botão da tela de Inadimplência só dispara um toast (`showToast`), sem nenhuma mutação real — não havia comportamento de verdade para replicar. Omitido da implementação; renegociação de contrato fica para uma fase futura, se vier a ser priorizada.
- **`pctPago`/saldo do contrato usam só as parcelas** (`contratos_crediario.valor_total` = soma das parcelas, conforme a RPC `fechar_venda` da Fase 4) — a entrada/à vista da venda é um pagamento separado em `venda_pagamentos`, fora do contrato de crediário. A visão "Por contrato" é sobre a parte financiada, não o valor total do veículo.

### Testes E2E (`e2e/fase5-contas-receber.spec.ts`)

2 testes: baixa de parcela em atraso com verificação de juros/multa calculados dinamicamente com a mesma fórmula do domínio (evita teste frágil dependente da hora do dia em que roda) e persistência correta no banco (`status`, `valor_pago`, `juros_multa_aplicado`, `forma_pagamento`); e visão "Por contrato" + "Inadimplência" com agregação por cliente. Novo helper `seedContratoCrediario()` em `e2e/helpers/admin.ts` (insere venda + contrato + parcelas direto, sem depender do wizard de Nova venda, para controlar vencimentos no passado).

Suíte completa: 16/16 testes E2E passando (14 anteriores + 2 novos), 28/28 vitest (20 anteriores + 8 novos de `lib/domain/juros.ts`), typecheck/lint/build limpos.

## Decisões registradas

- Status de parcela "Atrasada" é sempre derivado em tempo de leitura (`statusEfetivo`), nunca persistido por um job — evita a necessidade de infraestrutura de cron que o projeto não tem.
- Juros + multa do protótipo eram hardcoded (2% + 0,1%/dia) mas já batiam exatamente com os defaults de `tenant_config` desde a Fase 0 — só precisou parametrizar a fórmula, sem reinventar o cálculo.
- Corrigido bug real do protótipo onde o valor de juros mostrado na baixa nunca era persistido — ver seção "O que foi feito".

## Pendências abertas

- Próximo passo: Fase 6 (Dashboard) — KPIs, parcelas vencendo, gráfico 12 meses, aging de estoque, mix carro×moto, top modelos, últimas movimentações. Consome dado de todas as fases anteriores (Estoque, Vendas, Contas a receber), por isso ficou por último.
- Migration `0006_fase5_contas_receber.sql` já foi confirmada como aplicada pelo usuário durante esta sessão.
- Renegociação de contrato (botão "Renegociar" da Inadimplência) segue sem funcionalidade real — fica registrado como pendência pós-MVP se for priorizado.
- Painel administrativo do dono da plataforma continua não construído.
