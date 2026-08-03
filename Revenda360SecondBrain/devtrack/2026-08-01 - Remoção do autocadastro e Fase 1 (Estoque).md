# 2026-08-01 — Remoção do autocadastro e Fase 1 (Estoque)

Continuação da sessão de fundação (ver devtrack anterior do mesmo dia).

## O que foi feito

### 1. Remoção do autocadastro público

Usuário esclareceu o modelo de negócio: ele mesmo vende e provisiona o sistema para as revendas clientes, pelo painel administrativo — não é self-service. Removidos `/cadastro`, `/onboarding`, `/auth/confirm`, a `signup` action. Middleware simplificado para só fazer gate de autenticado/não-autenticado. Testes E2E reescritos para provisionar tenant direto via `createTenantWithGestor()` (Admin API + inserts com service role), espelhando o que o painel administrativo fará.

**Bug de ambiente descoberto durante a validação**: ao apagar pastas de rota com o dev server do Turbopack ainda rodando, o cache incremental ficou órfão e travou o carregamento de `/login` (tanto no Chrome real quanto no Playwright — "Target crashed"). Resolvido matando o processo e apagando `.next/` por completo antes de reiniciar. Lição registrada: sempre reiniciar do zero depois de remover pastas de rota inteiras.

Commit `702a3ac`, pushado.

### 2. Fase 1 — Estoque + Ficha do veículo

- Migration `0003_fase1_estoque.sql`: tabelas `veiculos` (com `especificacoes jsonb` para campos exclusivos de carro/moto), `custos_veiculo`, `veiculo_fotos`, RLS, e bucket de Storage privado `veiculo-fotos` com policy por tenant. Aplicada pelo usuário no SQL Editor.
- `lib/domain/pricing.ts`: funções puras (custoTotal, margemR, margemPct, precoMinimoEfetivo, diasEstoque, ocultarCamposSensiveis) — 16 testes vitest, incluindo casos reais do protótipo (veículo m1: compra 12800 + custo 420 = custo total 13220, margem 2770/17.32%).
- `lib/validation/veiculo.schema.ts`: zod para `especificacoes` de carro (câmbio, carroceria, portas, opcionais...) e moto (cilindrada, tipo, acessórios...), sem discriminador redundante — o tipo vem da coluna `veiculos.tipo`.
- `lib/data/veiculos.ts`: `listVeiculos(role, filtros)` e `getVeiculo(id, role)`, ambos ocultando `preco_minimo`/`valor_compra`/`margem_r`/`margem_pct`/`custo_total` quando `role !== 'gestor'`. Custo total calculado via embed PostgREST (`veiculos.select('*, custos_veiculo(valor)')`) — precisou declarar `Relationships` corretamente em `types/database.types.ts` para o embed tipar certo.
- Tela de Estoque (`/estoque`): tabela densa + galeria, alternância via querystring (`?visao=`), filtros (busca/tipo/status/marca) via form GET simples, fallback sempre-em-cards no mobile independente da visão escolhida.
- Ficha do veículo (`/estoque/[id]`): abas Resumo/Financeiro/Documentação (checklist com semáforo)/Histórico (raso: entrada + custos lançados, ordenados)/Anúncios — aba Financeiro some inteiramente da lista de abas para não-gestor, não só os dados dentro dela.
- Seed de demonstração (`supabase/seed_fase1_veiculos.sql`): 19 veículos reais do protótipo (13 motos + 6 carros), datas de entrada recalculadas a partir do `diasEstoque` original com referência 28/07/2026. Testado via inserção direta (REST/service role) num tenant de QA antes de finalizar.
- **Bug encontrado e corrigido durante o QA visual**: `Button` do shadcn com `render={<Link .../>}` para navegação disparava aviso do Base UI ("nativeButton"), porque o `Button` primitivo espera renderizar um `<button>` nativo por padrão. Corrigido com `nativeButton={false}` nos dois usos (botão "Entrada de veículo" e "Limpar" filtros). Confirmado que o `SidebarMenuButton` (usa `useRender` direto, não o primitivo `Button`) não tem esse problema.
- Testes E2E (`e2e/fase1-estoque.spec.ts`): gestor vê lista completa + filtro por tipo; gestor vê aba Financeiro; vendedor não vê colunas financeiras nem a aba Financeiro. Novo helper `seedVeiculos()` e `adicionarMembro()` em `e2e/helpers/admin.ts`.

Commit `bf8fe99`, pushado. Suíte completa: 6/6 testes E2E passando, 16/16 vitest, typecheck/lint/build limpos.

## Decisões registradas

- [[2026-08-01 - Remoção do autocadastro público]]

## Pendências abertas

- Próximo passo: Fase 2 (Entrada de veículo) — formulário multi-etapa, upload de fotos, resumo de margem ao vivo.
- Painel administrativo do dono da plataforma continua não construído — é o único jeito de provisionar uma revenda cliente de verdade (hoje só manual via API/SQL).
