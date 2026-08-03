# 2026-08-01 — Fase 4 (Nova venda)

Continuação da sessão de Fase 3 (ver devtrack anterior do mesmo dia).

## O que foi feito

- Reli o protótipo original (`Revenda360.dc.html`) para extrair a lógica real do wizard de venda antes de implementar — o plano só listava "wizard de 7 etapas", sem detalhar fórmulas. Achados-chave:
  - `VENDA_STEPS = ['Veículo', 'Cliente', 'Negociação', 'Pagamento', 'Crediário', 'Documentos', 'Confirmação']`.
  - A etapa **Documentos** no protótipo real contém vendedor/comissão/garantia/observações (não só os botões de gerar documento) — diferente do que o nome sugere à primeira vista.
  - Fórmula de juros do crediário (função `gerarParcelas` do protótipo): `valorComJuros = valorBase * (1 + taxa/100 * qtd/2)`, parcela = `valorComJuros / qtd` — juros simples aproximado pelo prazo médio de exposição (qtd/2), não Price/SAC. Implementada em `lib/domain/parcelas.ts` com 4 testes vitest validando o valor exato e o rollover de mês (dia 31 + 1 mês transborda pro mês seguinte, mesmo comportamento nativo de `Date` que o protótipo usa, não uma correção à parte).
  - "Falta compor" / comissão / lucro da operação: fórmulas triviais replicadas na Negociação/Pagamento/Confirmação (`total = valorVenda - desconto`, `falta = total - soma(pagamentos)`, `comissaoValor = total * comissaoPct/100`, `lucro = total - custoTotal - comissaoValor`).
- Migration `0005_fase4_vendas.sql`: tabelas `vendas`, `venda_pagamentos`, `contratos_crediario`, `parcelas` + RLS, e a função transacional `fechar_venda(payload jsonb) returns uuid` — insere venda + pagamentos + (se houver) contrato/parcelas, e dá baixa no veículo (`status = 'Vendido'`) numa única transação, com `for update` no veículo para evitar concorrência. Roda como `security invoker` (não definer): cada insert já é coberto pelas policies de tenant_isolation, diferente das funções de onboarding da Fase 0 que precisavam contornar RLS.
- `lib/validation/venda.schema.ts`: schema zod do payload (`fecharVendaSchema`), incluindo `pagamentoSchema`/`crediarioSchema` aninhados.
- Wizard completo em `components/features/vendas/nova/` (7 componentes de etapa + orquestrador `nova-venda-wizard.tsx`), mesma arquitetura da Entrada de veículo (Fase 2): Tabs do shadcn para navegação livre entre etapas, estado local com valores numéricos como string, `useTransition` + Server Action no fechamento.
- Server Action `fecharVenda` em `app/(app)/vendas/nova/actions.ts` — valida com zod e chama `supabase.rpc('fechar_venda', { payload })`.

### Decisões de escopo (simplificações deliberadas)

- **Sem auto-criação de veículo a partir da troca**: o protótipo só guarda `trocaDescricao`/`trocaValor` como texto livre (não cria um veículo de verdade no estoque a partir da troca). Mantive esse comportamento — o valor da troca vira só mais uma forma de pagamento (`tipo: 'troca'`, com a descrição em `detalhes` jsonb). Criar o veículo da troca automaticamente ficou de fora de propósito: o plano já reserva "Avaliação/Troca" como tela dedicada numa fase pós-MVP, que é o lugar certo para essa entrada estruturada (placa/marca/modelo/documentação).
- **Cliente balcão sem auto-cadastro silencioso**: diferente do protótipo (que criava um cliente novo automaticamente ao digitar um nome sem selecionar da lista), a versão real só grava `cliente_nome_avulso` (texto solto) quando não há cliente selecionado — não insere uma linha em `clientes` por trás das cortinas. Quem quiser o cadastro completo usa a tela de Clientes (Fase 3) antes de iniciar a venda.

### Testes E2E (`e2e/fase4-nova-venda.spec.ts`)

2 testes: venda à vista simples com cliente balcão (verifica `vendas.cliente_id is null`, `status = 'Vendido'` no veículo), e venda com crediário próprio (seleciona cliente cadastrado, compõe entrada + crediário, gera parcelas na UI, confirma, e verifica no banco `contratos_crediario.qtd_parcelas = 6` e as 6 `parcelas` com `status = 'A vencer'`). Novo helper `seedCliente()` em `e2e/helpers/admin.ts`.

Commit pendente de push nesta sessão. Suíte completa: 14/14 testes E2E passando, 20/20 vitest, typecheck/lint/build limpos.

## Decisões registradas

- Fórmula de juros do crediário é juros simples sobre prazo médio (`taxa% * qtd/2`), não Price/SAC — validado lendo o código-fonte do protótipo, não os dados de exemplo (que usavam parcelas arredondadas manualmente, sem refletir a fórmula real).
- Criação de veículo a partir de troca e auto-cadastro de cliente balcão foram deliberadamente **não** replicados do protótipo — ver seção acima.

## Pendências abertas

- Próximo passo: Fase 5 (Contas a receber) — 3 visões (parcela/contrato/inadimplência) + modal de baixa usando `calcularJurosMulta` (ainda não implementado, é o próximo domínio puro a construir).
- `/vendas/realizadas` continua sendo apenas o stub — a venda concluída redireciona para lá mas a tela ainda não lista nada; isso é esperado (fora do escopo desta fase), mas vale lembrar ao chegar em fases futuras que tocam vendas.
- Painel administrativo do dono da plataforma continua não construído.
