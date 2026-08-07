# Tier 3 pós-MVP: Consignados, Fornecedores, Marcas/Modelos

Continuação da mesma sessão dos Tiers 1 e 2 (ver devtracks anteriores no
mesmo dia). Fecha o catálogo de estoque.

## O que foi construído

### Fase 15 — Consignados (commits `5355e51`)
`/estoque/consignados` (disponíveis x vendidos, repasse/comissão só pra
gestor). Entrada de veículo ganha campos de consignante quando origem =
"Consignado" (reaproveita o select que já existia).

**Decisões perguntadas ao Enzo antes de implementar** (o guia exigia parar):
- Comissão de consignação é **valor fixo de repasse**, não percentual — o
  que vender acima do repasse fica com a revenda automaticamente.
- Repasse ao consignante vira **Conta a pagar automaticamente** quando o
  veículo é vendido (reaproveita a Fase 11) — isso já alimenta o Fluxo de
  caixa de graça. DRE por veículo atualizado pra descontar o repasse na
  margem de consignados.

**Gap de integração encontrado e corrigido**: veículo consignado nasce com
status "Consignado", não "Disponível" — sem ajustar a query de Nova venda e
a guarda da RPC `fechar_venda`, um consignado nunca seria vendido de
verdade. Corrigido (RPC recriada com `create or replace`, mesma assinatura).

**Regressão pega e corrigida antes do commit**: `lib/data/dre.ts` passou a
consultar a tabela nova sempre, quebrando o DRE (já em produção) pra quem
não tinha a migration — corrigido pra degradar graciosamente.

### Fase 16 — Fornecedores (commit `7253b7c`)
`/fornecedores` (lista + cadastro/edição + contagem de veículos por
fornecedor). `veiculos.fornecedor` (texto livre) não é tocado. Entrada de
veículo ganha um select de fornecedor cadastrado ao lado do campo de texto
livre, com "+Novo" pra cadastrar sem sair da tela.

### Fase 17 — Marcas/Modelos (commit `e9f0010`)
`/marcas-modelos` (catálogo com marcas e modelos aninhados, editar/
desativar). `veiculos.marca`/`modelo` (texto livre) não são tocados — sem
tabela nova nos veículos, já que não havia pedido de contagem por marca
(diferente de Fornecedores). Selects em cascata (marca → modelo) na Entrada
de veículo, com cadastro inline dos dois níveis.

**Regressão pega e corrigida antes do commit**: a primeira versão renomeou
os campos de texto livre "Marca"/"Modelo" pra "Marca (texto livre)"/"Modelo
(texto livre)", quebrando 2 testes e2e já existentes (Fase 2 e Fase 9) que
usam `getByLabel("Marca")` sem `exact` — o novo campo "Marca cadastrada"
passou a colidir por substring. Revertido pro rótulo original; o select
novo ficou com rótulo sem a palavra "marca" ("Selecionar do catálogo").

## Padrão consolidado nesta sessão pra tabelas novas que um formulário já-em-produção pode tocar

Toda vez que um cadastro existente (Entrada de veículo) ganhou um campo
opcional ligado a uma tabela nova (Fases 15, 16, 17), duas coisas precisam
acontecer juntas, ou a tela quebra pra quem não aplicou a migration ainda:
1. No **servidor**: só incluir a coluna nova no INSERT/UPDATE quando o
   valor é realmente usado (nunca sempre, nem com `null`).
2. Na **leitura que popula o formulário** (lista de fornecedores, marcas):
   degradar pra lista vazia em erro, nunca lançar exceção.
Isso já rendeu 2 regressões reais nesta sessão (Fase 9 na primeira rodada,
Fase 15/DRE agora) — documentando aqui pra próxima fase que mexer em
Entrada de veículo lembrar de checar os dois pontos de propósito.

## Pendências que precisam de você (Enzo)

**Três migrations novas, ainda não aplicadas** (0010 de Comissões, do Tier
2, também segue pendente):
1. `supabase/migrations/0010_fase13_comissoes.sql` (Tier 2, ainda pendente)
2. `supabase/migrations/0011_fase15_consignados.sql`
3. `supabase/migrations/0012_fase16_fornecedores.sql`
4. `supabase/migrations/0013_fase17_marcas_modelos.sql`

Rode todas no SQL Editor do Supabase, nessa ordem.

## Testes

- Typecheck, lint, build: limpos em todo commit.
- Unit (Vitest): 50/50, sem mudança nesta sessão.
- E2E (Playwright): 40 specs no total agora (3 novos: fase15, fase16,
  fase17). 35/40 passando — as 5 falhas restantes são exatamente as
  migrations pendentes acima, confirmado isolando a causa raiz em cada uma.

## Estado do roadmap após esta sessão

Tier 0 (deploy) segue esperando o Enzo. Tier 1 100% funcional. Tier 2 falta
só a migration 0010. Tier 3 pronto do lado do código, falta aplicar 0011,
0012, 0013. Próximo: Tier 4 (Régua de cobrança, Leads/CRM kanban, Propostas,
Renegociação de contrato) — tem MUITO mais pontos de decisão de negócio
(biblioteca de drag-and-drop, PDF ou não, automação de WhatsApp) do que os
Tiers 1-3, recomendo tratar fase a fase com mais pausas pra confirmar
escopo.
