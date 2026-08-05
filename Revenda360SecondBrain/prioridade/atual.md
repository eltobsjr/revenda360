# Prioridade atual — Revenda360

Atualizado em 2026-08-05.

## Agora (próximo passo)

**MVP completo — todas as 6 fases do plano original estão implementadas, e o painel administrativo (v1) também, já com a conta do dono da plataforma provisionada.**
Não há mais uma "próxima fase" na sequência original nem pendência operacional aberta. Os itens abaixo (pós-MVP) são os candidatos para a próxima frente de trabalho — nenhum priorizado ainda, esperando você escolher.

## Concluído

- **Fase 0** — Fundação (auth, equipe, shell) — commits `5431eb0`, `7505f0f`, `b22377d`, `c16fda8`
- **Rework de design com shadcn/ui** (2 rodadas de ajuste)
- **Remoção do autocadastro público** — commit `702a3ac`
- **Fase 1** — Estoque + Ficha do veículo — commit `bf8fe99`
- **Fase 2** — Entrada de veículo (wizard completo) — commit `4c0f987`
- **Fase 3** — Clientes básico (lista, busca, cadastro rápido) — commit `d859f6e`
- **Fase 4** — Nova venda (wizard 7 etapas + RPC transacional `fechar_venda`) — commit `90aba0c`
- **Fase 5** — Contas a receber (3 visões + baixa de parcela com juros/multa + link de cobrança WhatsApp) — ver devtrack `2026-08-03 - Fase 5 (Contas a receber).md`
- **Fase 6** — Dashboard (KPIs, parcelas vencendo, aging, gráfico 12 meses, mix carro×moto, top modelos, últimas movimentações) — ver devtrack `2026-08-03 - Fase 6 (Dashboard) e MVP completo.md`
- **QA pós-MVP** — 11 bugs reais corrigidos (arredondamento de parcelas, timezone em datas gravadas, normalização de meia-noite em juros/aging, corrida em baixa de parcela, agrupamento de inadimplência por homônimo, vazamento de custo de aquisição pro vendedor, entre outros) — commits `1573e8a`, `82f9d1e`, ver devtrack `2026-08-03 - QA pós-MVP (correção de 11 bugs reais).md`
- **Painel administrativo do dono da plataforma (v1)** — provisiona revenda (tenant + loja + gestor) via `/admin`, sem autocadastro público — commit `8e3051b` (Enzo), ver devtrack `2026-08-03 - Painel administrativo do dono da plataforma (v1).md`. Migration aplicada e conta do dono da plataforma provisionada em 2026-08-05 (via `scripts/local-seed-platform-admin.mjs`, não versionado).

## Pós-MVP — ordem de prioridade (definida em 2026-08-05)

Guia de construção fase a fase, com prompt pronto pra cada uma, em
`Revenda360SecondBrain/prioridade/guia-construcao-enzo.md`.

### Tier 0 — bloqueia vender pra qualquer revenda real
1. **Deploy/CI** — hoje o app só roda local; sem isso nenhum cliente acessa o sistema.

### Tier 1 — buracos no ciclo que já está em uso
2. **Vendas realizadas** (`/vendas/realizadas`, hoje stub) — falta o "ver o que já vendi".
3. **Avaliação/Troca** (`/estoque/avaliacao-troca`, hoje stub) — Nova venda já aceita troca (`venda_pagamentos.tipo = 'troca'`) mas decisão registrada foi não criar o veículo recebido no estoque a partir disso; sem esta tela, todo trade-in é um veículo que a revenda tem fisicamente mas o sistema não sabe que existe.
4. **Clientes completo** (ficha com histórico) — hoje `/clientes` só lista/busca/cria rápido.
5. **Contas a pagar** (`/financeiro/pagar`, hoje stub) — Financeiro só enxerga o que entra.

### Tier 2 — fecha o módulo financeiro
6. **Fluxo de caixa** (`/financeiro/fluxo-caixa`, hoje stub)
7. **Comissões** (`/financeiro/comissoes`, hoje stub) — `vendas.comissao_valor` já existe, falta a tela de gestão/pagamento.
8. **DRE por veículo** (`/financeiro/dre`, hoje stub)

### Tier 3 — completa o catálogo de estoque
9. **Consignados** (`/estoque/consignados`, hoje stub) — `veiculos.status` já tem o valor `"Consignado"`, mas não existe modelagem de consignante/comissão/repasse.
10. **Fornecedores** (`/fornecedores`, hoje stub) — hoje `veiculos.fornecedor` é texto livre, sem tabela própria.
11. **Marcas/Modelos** (`/marcas-modelos`, hoje stub) — cadastro estruturado; hoje `veiculos.marca`/`modelo` são texto livre.

### Tier 4 — funil de vendas
12. **Régua de cobrança automatizada via WhatsApp** — evolução do link manual `wa.me` que já existe (Fase 5).
13. **Leads (CRM kanban)** (`/vendas/leads`, hoje stub)
14. **Propostas** (`/vendas/propostas`, hoje stub)
15. **Renegociação de contrato de crediário** — botão "Renegociar" na Inadimplência existe só como toast herdado do protótipo.

### Tier 5 — cauda longa
16. Relatórios / PDF (`/relatorios`, hoje stub)
17. Configurações da loja (`/configuracoes`, hoje stub)
18. Permissões avançadas (hoje só 3 papéis: gestor/vendedor/financeiro)
19. Integrações reais (FIPE, placa/Renavam, WhatsApp Business API, portais de anúncio)
20. PWA
21. Billing do SaaS — baixa urgência enquanto a venda pra cada revenda é manual/negociada direto
22. SMTP próprio no Supabase — só relevante se algum fluxo voltar a depender de e-mail

## Regras fixas para toda fase daqui em diante

- Toda tela nova nasce com teste E2E Playwright.
- Ajuste de design sempre nos componentes compartilhados, nunca só numa tela.
- Nunca incluir "Co-Authored-By: Claude" nos commits.
- **Atualizado 2026-08-01, reconfirmado 2026-08-05**: pode commitar (e pushar) sem pedir permissão a cada vez — inclusive ao terminar uma fase — desde que passe antes por typecheck + lint + build + testes automáticos, todos limpos. `CLAUDE.md` já reflete essa regra (só estava desatualizado até 2026-08-05).
