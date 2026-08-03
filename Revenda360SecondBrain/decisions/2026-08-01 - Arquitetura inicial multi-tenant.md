# Arquitetura inicial multi-tenant — 2026-08-01

## Contexto

Construir o Revenda 360 do zero a partir de um protótipo HTML navegável (`Revenda360.dc.html`) que validou UX, dados e regras de negócio, mas não tinha backend nem autenticação real. Decisão do usuário: SaaS multi-tenant desde já, MVP enxuto primeiro, integrações externas manuais/simuladas por ora, Supabase Auth real com 3 papéis.

## Alternativas consideradas

- **RLS via subquery em `profiles`** vs. **custom claims no JWT**: optamos pela subquery (`current_tenant_id()` consultando `profiles`) por ser mais simples de implementar agora; custom claims via access token hook ficou registrado como otimização futura (fase pós-MVP), só necessária se houver problema de performance.
- **Ocultação de campos sensíveis (preço mínimo/margem/custo) por role**: RLS é por linha, não por coluna. Decidimos que o mecanismo principal é filtragem na camada de acesso a dados do servidor (`lib/data/*` remove os campos antes de repassar ao client), com view mascarada como defesa em profundidade só se surgir leitura direta client→Supabase no futuro.
- **Preço mínimo ambíguo no protótipo**: o campo `entradaForm.precoMinimo` é cadastrável, mas o wizard de venda usava `custoTotal * 1.08` hardcoded. Resolvido como: `minimo_efetivo = COALESCE(veiculo.preco_minimo, custo_total * (1 + margem_minima_pct_default/100))`, com o percentual configurável por tenant em `tenant_config`.
- **Venda à vista vs. parcelada no schema**: em vez de duas modelagens diferentes, `vendas` é sempre a tabela-cabeçalho (cria em toda venda), `venda_pagamentos` guarda a composição (linhas somáveis: dinheiro/PIX/cartão/troca/financiamento/crediário), e `contratos_crediario` só existe quando há parcela própria da loja.
- **Onboarding e criação de membro de equipe**: exigem inserir linhas antes de existir um profile válido para RLS funcionar — resolvido com duas funções Postgres `security definer` (`onboarding_criar_tenant`, `criar_membro_equipe`) em vez de usar a service role key na aplicação, concentrando a exceção num único lugar auditável no banco.

## Decisão

Schema: `tenants`, `tenant_config`, `lojas`, `profiles` (role enum gestor/vendedor/financeiro) como fundação (Fase 0). Próximas fases adicionam `veiculos`, `custos_veiculo`, `veiculo_fotos`, `vendas`, `venda_pagamentos`, `contratos_crediario`, `parcelas` — todas com `tenant_id` + RLS via `current_tenant_id()`.

Sem Supabase CLI conectada — migrations são arquivos `.sql` versionados em `supabase/migrations/`, aplicados manualmente pelo usuário no SQL Editor do dashboard (decisão explícita do usuário: "não quero conectar na CLI").

## Consequências

- Toda tabela nova precisa lembrar de adicionar `tenant_id not null` + policy RLS — não há trigger automático que force isso.
- `types/database.types.ts` é escrito à mão (não gerado via `supabase gen types`) até o usuário eventualmente conectar a CLI — precisa manter sincronizado manualmente a cada migration.
- A operação "fechar venda" (Fase 4) precisa ser uma função Postgres transacional própria (não uma sequência de inserts do Server Action), para evitar inconsistência (veículo vendido sem contrato, etc).

## Referências

- Plano completo salvo em `~/.claude/plans/home-eltobsjr-downloads-revenda-360-pro-shimmying-pony.md`
- [[Revenda360 — Visão Geral]]
