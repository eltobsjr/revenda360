# Prioridade atual — Revenda360

Atualizado em 2026-08-07.

## Agora (próximo passo)

**Tier 1, Tier 2, Tier 3 e Tier 4 completos do lado do código (Fases 8-17,
19-21 — Fase 18 adiada a pedido do Enzo)** — ver devtracks
`2026-08-07 - Tier 1/2/3/4 pós-MVP (...).md`. **Atualizado 2026-08-07 à
noite (2ª verificação)**: das 7 migrations pendentes, 6 estão confirmadas
aplicadas (0010, 0011, 0013, 0014, 0015, 0016). Verificando o E2E completo
depois disso também achei e corrigi 3 bugs reais (não relacionados a
migration) que só apareciam com as tabelas novas existindo — ver devtracks
`2026-08-07 - Verificação pós-migrations e 3 bugs reais corrigidos.md` e
`2026-08-07 - Resumo do dia (Tiers 1-4 pós-MVP completos + correções).md`,
commit `3e2547b`. **A `0012_fase16_fornecedores.sql` foi checada de novo
à noite, depois do Enzo confirmar que já tinha rodado todos os SQLs, e
`public.fornecedores` continua não existindo no schema** — checar direto
no banco antes de assumir aplicada, essa migration especificamente já
"escapou" duas vezes. Falta você (Enzo):
1. Rodar no SQL Editor do Supabase: **`0012_fase16_fornecedores.sql`**
   (a única que ainda falta).
2. Fase 7 (Deploy/CI) — Parte 1 (deploy manual na Vercel) ainda pendente,
   segue bloqueando acesso de cliente real ao sistema (Tier 0).

E2E atual: 41/43 (as 2 falhas são só fase16-fornecedores, esperando a
0012). Depois dela aplicada e do deploy feito, seguir para o Tier 5 (cauda
longa) — quase toda fase de lá tem decisão de negócio explícita pra
confirmar antes de começar, ver notas por fase abaixo.

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
1. **Deploy/CI** — **Parte 2 (CI) concluída em 2026-08-06** (`.github/workflows/ci.yml`, ver devtrack `2026-08-06 - Fase 7 (Deploy CI).md`). **Parte 1 (deploy manual na Vercel) ainda pendente com o Enzo** — sem ela nenhum cliente acessa o sistema.

### Tier 1 — buracos no ciclo que já está em uso — CONCLUÍDO (código) em 2026-08-07
2. **Vendas realizadas** (`/vendas/realizadas`) — commit `8c2292c`. ✅
3. **Avaliação/Troca** (`/estoque/avaliacao-troca`) — commits `ae64cc7`, `7656204`. ✅ (precisa da migration 0008 aplicada)
4. **Clientes completo** (ficha com histórico) — commit `f939a22`. ✅
5. **Contas a pagar** (`/financeiro/pagar`) — commit `4a617ed`. ✅ (precisa da migration 0009 aplicada)

### Tier 2 — fecha o módulo financeiro — CONCLUÍDO (código) em 2026-08-07
6. **Fluxo de caixa** (`/financeiro/fluxo-caixa`) — commit `78a9c99`. ✅
7. **Comissões** (`/financeiro/comissoes`) — commit `34e8678`. ✅ (precisa da migration 0010 aplicada)
8. **DRE por veículo** (`/financeiro/dre`) — commit `ce26288`. ✅

### Tier 3 — completa o catálogo de estoque — CONCLUÍDO (código) em 2026-08-07
9. **Consignados** (`/estoque/consignados`) — commit `5355e51`. ✅ (precisa da migration 0011 aplicada)
10. **Fornecedores** (`/fornecedores`) — commit `7253b7c`. ✅ (precisa da migration 0012 aplicada)
11. **Marcas/Modelos** (`/marcas-modelos`) — commit `e9f0010`. ✅ (precisa da migration 0013 aplicada)

### Tier 4 — funil de vendas
12. **Régua de cobrança automatizada via WhatsApp** — **ADIADA a pedido do Enzo em 2026-08-07** (não quer a função agora, não é só questão de custo). Não construída, nem a versão semi-automática sem custo.
13. **Leads (CRM kanban)** (`/vendas/leads`) — commit `4d62fd5`. ✅ (precisa da migration 0014 aplicada)
14. **Propostas** (`/vendas/propostas`) — commit `aed4c86`. ✅ (precisa da migration 0015 aplicada)
15. **Renegociação de contrato de crediário** (botão real em Contas a receber → Por contrato — o stub do protótipo não existia mais no código, foi construído do zero) — commit `6fa5f18`. ✅ (precisa da migration 0016 aplicada)

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
