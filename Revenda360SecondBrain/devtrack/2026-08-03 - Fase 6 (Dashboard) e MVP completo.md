# 2026-08-03 — Fase 6 (Dashboard) e MVP completo

Continuação da mesma sessão da Fase 5 (ver devtrack anterior do mesmo dia).

## O que foi feito

- Reli `computeDashboard()` no protótipo (`Revenda360.dc.html`) antes de implementar. Achados-chave:
  - 8 KPIs, widget "Parcelas vencendo" (próxima parcela pendente por contrato, atrasada primeiro), "Aging de estoque" (4 faixas: 0–30/31–60/61–90/+90 dias), gráfico de barras+linha "Vendas — últimos 12 meses" (faturamento/lucro), "Mix carros×motos", "Top modelos" e "Últimas movimentações".
  - O seletor de período (30/90/180/12m) no cabeçalho é **dead UI** no protótipo — `onPeriodoChange` só grava o state, `computeDashboard()` nunca lê `periodo`. Omitido da implementação real, mesmo padrão já usado nas Fases 4/5 para não replicar controles decorativos sem função.
  - "Vendas no mês" no protótipo não filtra por mês de verdade (`veic.filter(v => v.status === 'Vendido')`, sem checar data) — só funcionava no mock porque os poucos veículos "Vendido" do seed calhavam de ser recentes. Corrigido na implementação real: filtro de fato por `data_venda` dentro do mês corrente, senão o KPI acumularia todas as vendas históricas.
  - "Lucro líquido" do protótipo usava `margemR` pré-computado no mock (preço de venda − custo, sem descontar comissão). Implementação real usa o dado de venda de verdade: `lucro = valor_final − custo_total(veículo) − comissao_valor` — mais preciso porque `valor_final` já reflete desconto negociado e a comissão é um custo real da operação, dados que o protótipo (mock estático) não tinha disponíveis.
  - "Giro médio" do protótipo faz média de `diasEstoque` sobre **todos** os veículos, incluindo os já vendidos há muito tempo (usando "hoje" como referência para todos) — isso infla artificialmente o indicador conforme o histórico cresce. Implementação real usa só os veículos **ativos** (mesma população do Aging de estoque), que é a leitura padrão de "giro médio" numa revenda (tempo de exposição do estoque atual).
  - "Últimas movimentações" no protótipo vinha de um array mockado (`data.movimentacoes`) — não existe (e não vai existir) uma tabela de log de atividades no schema real. Implementação real monta o feed combinando 3 fontes já existentes (`vendas`, `veiculos.data_entrada`, `parcelas` com baixa), ordenadas por data e cortadas nas 6 mais recentes — sem tabela nova.
- **Sem migration nova**: Dashboard é 100% leitura agregada sobre tabelas já existentes (Fases 0–5).
- `lib/domain/dashboard.ts` (puro, testado): `agruparVendasPorMes` (buckets de 12 meses com zero-fill), `classificarAging`, `calcularMixPercentual`.
- `lib/data/dashboard.ts` — `getDashboardData(role)`: agrega estoque (via `listVeiculosComFinanceiro`, novo export "cru" em `lib/data/veiculos.ts` reaproveitado do `listVeiculos` existente), vendas do mês/12 meses, parcelas (via `listParcelas` da Fase 5) e movimentações recentes.
- **Ocultação de campos sensíveis também no Dashboard**: KPIs "Lucro líquido" e "Margem média" (e a série de lucro no gráfico) só aparecem para `role: gestor` — mesmo critério de `CAMPOS_SENSIVEIS` já usado em Estoque (`lib/domain/pricing.ts`). Os demais 6 KPIs (estoque, vendas, ticket médio, a receber, inadimplência, giro médio) não envolvem custo/margem e ficam visíveis para todos os papéis.
- UI em `components/features/dashboard/`: cards de KPI, parcelas vencendo, aging (barras de progresso), gráfico SVG (barras de faturamento + linha de lucro, renderizado no servidor, sem lib de gráficos), mix+top modelos, últimas movimentações.

### Catch-up da Fase 5: link real de cobrança via WhatsApp

Ao revisar o protótipo notei que o botão "Cobrar" da tela de Inadimplência (Fase 5) e o botão homônimo do widget "Parcelas vencendo" do Dashboard eram **ambos só um toast** no protótipo (`showToast(...)`, sem link `wa.me` de verdade) — mas o plano de fases (`prioridade/atual.md`) já previa explicitamente "lembrete de cobrança via link wa.me manual, sem API paga" como parte do escopo da Fase 5, e isso ficou de fora na sessão anterior sem eu registrar a omissão corretamente. Corrigido nesta sessão:
- `lib/domain/whatsapp.ts` (`linkCobrancaWhatsapp`, puro, testado): normaliza o `clientes.whatsapp` (texto livre) para dígitos e garante o código do país (55) antes de montar a URL `https://wa.me/...`.
- `InadimplenciaTable` (Fase 5) ganhou um botão real "Cobrar" que abre o link em nova aba, com mensagem pré-preenchida citando o valor em atraso. Só aparece quando o cliente tem WhatsApp cadastrado (não existe para cliente balcão).
- O widget "Parcelas vencendo" do Dashboard ficou **somente leitura** (sem os botões "Dar baixa"/"Cobrar" do protótipo) — link "Ver tudo →" leva para a tela completa de Contas a receber, onde ambas as ações já existem de verdade. Decisão de escopo: duplicar o dialog de baixa e o link de cobrança dentro de um card de dashboard não pareceu valer a complexidade extra para este MVP.

### Testes (`e2e/fase6-dashboard.spec.ts`, `lib/domain/dashboard.test.ts`, `lib/domain/whatsapp.test.ts`)

2 testes E2E: KPIs financeiros com valores calculados a partir de dados reais seedados diretamente (estoque, venda do mês, lucro líquido, aging em 2 faixas, parcela vencendo em atraso); e checagem de ocultação de KPIs sensíveis para role vendedor. Novos helpers `seedVenda()` e `dataVenda` opcional em `seedContratoCrediario()` (`e2e/helpers/admin.ts`) — o contrato de crediário também gera uma linha em `vendas` por baixo dos panos, e sem controlar a data isso poluía o KPI "Vendas no mês" dos testes.

Também corrigido `e2e/fase0.spec.ts`, que ainda checava o texto do stub antigo do Dashboard (`"Esta tela existe e é navegável"`) — agora verifica o heading real "Dashboard".

Suíte completa: **18/18 testes E2E passando** (16 anteriores + 2 novos), **38/38 vitest** (28 anteriores + 10 novos: 7 de `lib/domain/dashboard.ts`, 3 de `lib/domain/whatsapp.ts`), typecheck/lint/build limpos.

## Decisões registradas

- Seletor de período do Dashboard era dead UI no protótipo — omitido, mesmo padrão de não replicar controles não-funcionais.
- KPIs "Lucro líquido"/"Margem média" e a série de lucro do gráfico só para `role: gestor`, seguindo o mesmo critério de campos sensíveis já estabelecido desde a Fase 1.
- "Giro médio" redefinido para considerar só veículos ativos (não todo o histórico), correção real de comportamento vs. o protótipo (que inflava o indicador usando "hoje" como referência para veículos já vendidos há muito tempo).
- "Últimas movimentações" é um feed calculado on-the-fly a partir de 3 tabelas existentes, não um log persistido — decisão deliberada para não precisar de tabela nova nem de escrita adicional em cada operação.
- Link de cobrança via WhatsApp (`wa.me`) implementado de verdade na Inadimplência (Fase 5), corrigindo uma omissão da sessão anterior; o Dashboard não duplica essa ação, só linka para a tela cheia.

## Estado do MVP

**Todas as 6 fases do plano original estão implementadas**: Fase 0 (Fundação) → Fase 1 (Estoque) → Fase 2 (Entrada de veículo) → Fase 3 (Clientes) → Fase 4 (Nova venda) → Fase 5 (Contas a receber) → Fase 6 (Dashboard). `Revenda360SecondBrain/prioridade/atual.md` não tem mais um "próximo passo" de fase — só os itens de pós-MVP e os itens "fora da sequência" (painel administrativo, SMTP, deploy/CI).

## Pendências abertas

- **Painel administrativo do dono da plataforma** segue sendo o maior buraco: sem autocadastro público, é o único jeito de provisionar uma revenda cliente de verdade (hoje é manual via Admin API/SQL). Candidato natural a próxima grande frente de trabalho.
- Tela `/vendas/realizadas` continua só stub.
- Deploy/CI não configurado.
- Lista completa de itens pós-MVP em `prioridade/atual.md` (Consignados, Fornecedores, Contas a pagar, Fluxo de caixa, Comissões, DRE, Leads/CRM, integrações reais, etc.) — nenhum priorizado ainda.
