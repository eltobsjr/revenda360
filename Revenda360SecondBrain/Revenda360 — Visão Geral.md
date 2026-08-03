---
data: 2026-08-01
---

# Revenda360 — Visão Geral

## O que é

Revenda 360 é um SaaS multi-tenant de gestão para revendas de carros e motos seminovos (mercado brasileiro) — substitui o controle por planilha Excel que lojas de 1-3 unidades e 2-15 funcionários usam hoje, cobrindo estoque, entrada de veículo, vendas (à vista, crediário próprio, financiamento, troca, consignação), contas a receber/carnê e dashboard gerencial.

## Origem

O design e as regras de negócio foram validados num protótipo HTML navegável (`~/Downloads/Revenda 360 prototype built/Revenda360.dc.html`, formato proprietário `.dc` compilado por um runtime React próprio, sem backend real). Esse protótipo é **referência de comportamento e dados, não código a portar**. Ver [[2026-08-01 - Arquitetura inicial multi-tenant]] para o racional completo.

## Stack técnica

| Tecnologia | Detalhe |
|---|---|
| Next.js 16 (App Router) | TypeScript, Turbopack, Server Actions |
| Supabase | Postgres + RLS multi-tenant, Auth (`@supabase/ssr`), Storage |
| Tailwind CSS v4 + shadcn/ui | preset "nova", base neutra + 4 temas de marca (azul/verde/violeta/neutro) trocáveis em runtime |
| next-themes | tema claro/escuro |
| lucide-react | ícones |
| Vitest | testes unitários (funções de domínio) |
| Playwright | testes E2E |
| npm | package manager |

Sem Supabase CLI conectada nem Docker local — migrations SQL são aplicadas manualmente pelo usuário no SQL Editor do dashboard Supabase.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build       # build de produção
npm run lint         # ESLint
npm test              # Vitest (unitário)
npm run test:e2e   # Playwright (precisa do dev server rodando)
```

Variáveis de ambiente em `.env.local` (ver `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Estrutura de pastas principais

- `app/(auth)/` — só `login` (sem autocadastro público — ver [[2026-08-01 - Remoção do autocadastro público]])
- `app/(app)/` — rotas autenticadas (Dashboard, Estoque, Vendas, Clientes, Financeiro, Cadastros, Equipe, Relatórios, Configurações) — todas envolvidas pelo shell com sidebar (`components/app-shell.tsx`)
- `components/ui/` — componentes shadcn (fonte de verdade do design system — ver [[2026-08-01 - Rework de UI para shadcn ui]])
- `components/features/` — componentes específicos por domínio: `estoque/` (lista, ficha, wizard de entrada em `estoque/entrada/`), `clientes/`, `vendas/nova/` (wizard de 7 etapas), `equipe/`
- `lib/domain/` — funções puras de regra de negócio: `pricing.ts` (custo total, margem, preço mínimo efetivo), `parcelas.ts` (geração de parcelas de crediário com juros simples)
- `lib/data/` — acesso a dados com filtragem por role: `veiculos.ts`, `clientes.ts`, `tenant.ts`, `equipe.ts`
- `lib/validation/` — schemas zod: `veiculo.schema.ts`, `cliente.schema.ts`, `venda.schema.ts`
- `lib/supabase/` — clients server/browser/middleware
- `lib/auth/session.ts` — `getCurrentProfile`, `requireRole`
- `lib/nav.ts` — definição da navegação do sidebar
- `lib/brand-theme.ts` — os 4 temas de marca trocáveis
- `supabase/migrations/` — SQL versionado, aplicado manualmente (0001 a 0005 atualmente)
- `types/database.types.ts` — tipos do schema (escritos à mão por enquanto, sem CLI)
- `e2e/` — testes Playwright + `e2e/helpers/admin.ts` (cria/limpa dados de teste via Supabase Admin API)

## Modelo de dados (até a Fase 4)

- **Fundação**: `tenants`, `tenant_config` (multa/mora/margem mínima configuráveis por tenant), `lojas`, `profiles` (role: gestor/vendedor/financeiro). RLS via função `current_tenant_id()`. RPCs `security definer`: `onboarding_criar_tenant` e `criar_membro_equipe` — ver [[2026-08-01 - Arquitetura inicial multi-tenant]].
- **Estoque** (Fase 1-2): `veiculos` (identificação/documentação/aquisição/precificação + `especificacoes jsonb` para campos exclusivos de carro/moto), `custos_veiculo`, `veiculo_fotos` (Storage privado `veiculo-fotos`).
- **Clientes** (Fase 3): `clientes` (nome/cpf/whatsapp/email/cidade), índice único parcial por CPF dentro do tenant.
- **Vendas** (Fase 4): `vendas`, `venda_pagamentos` (um-para-muitos, cada forma de pagamento composta), `contratos_crediario` + `parcelas` (crediário próprio da loja). RPC `fechar_venda(payload jsonb)` — transacional, `security invoker` (as policies de tenant já bastam), dá baixa no veículo (`status = 'Vendido'`) na mesma transação.

Todas as tabelas de negócio seguem o mesmo padrão de RLS: `tenant_id not null` + policy `tenant_isolation` usando `current_tenant_id()`.

## Estado atual (2026-08-01)

MVP em andamento, fases 0 a 4 concluídas e testadas (14 testes E2E Playwright + 20 testes vitest, todos passando; typecheck/lint/build limpos a cada fase):

- **Fase 0 — Fundação**: auth (login only, sem autocadastro — ver [[2026-08-01 - Remoção do autocadastro público]]), gestão de equipe, shell de navegação, RLS multi-tenant validado por teste de isolamento.
- **Fase 1 — Estoque + Ficha do veículo**: lista (tabela/galeria), filtros, ocultação de campos sensíveis por role, abas de detalhe (Resumo/Financeiro/Documentação/Histórico/Anúncios).
- **Fase 2 — Entrada de veículo**: formulário multi-etapa completo (mesma tela cria e edita), upload de fotos, resumo de margem ao vivo.
- **Fase 3 — Clientes (básico)**: lista, busca por nome/CPF, modal de cadastro rápido.
- **Fase 4 — Nova venda**: wizard de 7 etapas fechando a venda via RPC transacional, com geração de parcelas de crediário próprio.

**Design system reconstruído com shadcn/ui** após feedback do usuário de que o visual genérico do shadcn "parecia muito IA" — ver [[2026-08-01 - Rework de UI para shadcn ui]].

**Próximo passo**: Fase 5 — Contas a receber. Ver `prioridade/atual.md` para o plano completo de fases.

## Pendências conhecidas

- Sem deploy/CI configurado ainda.
- `npm audit` acusa vulnerabilidades "high" internas ao Next.js 16.2.12 (postcss/sharp) — sem fix disponível sem downgrade do Next; só monitorar.
- Painel administrativo do dono da plataforma: arquitetado, não implementado — hoje o provisionamento de revenda cliente é manual (SQL/Admin API direto no Supabase).
- `/vendas/realizadas` ainda é só stub — a Nova venda redireciona pra lá mas a tela de listagem não foi construída (fica pra quando essa tela entrar na sequência de fases).
