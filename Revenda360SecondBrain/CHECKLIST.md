# Checklist — Revenda360

## Fase 0 — Fundação (concluída)

- [x] Migrations (tenants, tenant_config, lojas, profiles) + RLS + RPCs de onboarding/equipe
- [x] Supabase server/browser/proxy(middleware) clients + session helpers
- [x] Auth: login (autocadastro público removido — ver decisão de 2026-08-01)
- [x] Tela de Equipe (gestor cria vendedor/financeiro)
- [x] Shell de navegação (sidebar, topbar, tema claro/escuro, busca stub)
- [x] Design tokens portados do protótipo
- [x] Testes E2E (Playwright): fluxo completo + isolamento RLS entre tenants
- [x] Rework de UI com shadcn/ui (componentes reais, 4 temas de marca, ajustes de proporção/tipografia)
- [x] Removido autocadastro público (`/cadastro`, `/onboarding`, `/auth/confirm`) — revendas são provisionadas pelo dono da plataforma

## Fase 1 — Estoque + Ficha do veículo (concluída)

- [x] Migrations veiculos/custos_veiculo/veiculo_fotos + RLS + bucket Storage
- [x] `lib/domain/pricing.ts` (custo total, margem, preço mínimo efetivo, dias em estoque) + 16 testes vitest
- [x] `lib/data/veiculos.ts` com ocultação de campos sensíveis por role
- [x] Lista de Estoque (tabela + galeria, filtros, busca, fallback mobile em cards)
- [x] Ficha do veículo (abas Resumo/Financeiro/Documentação/Histórico/Anúncios — Financeiro oculta para não-gestor)
- [x] Seed de demonstração (19 veículos reais do protótipo) + validado end-to-end
- [x] Testes E2E (Playwright): visibilidade por role + filtro por tipo

## Fase 2 — Entrada de veículo (concluída)

- [x] Formulário multi-etapa (Identificação/Documentação/Aquisição/Custos/Precificação/Mídia/Observações) — mesma tela cria e edita
- [x] `lib/validation/veiculo.schema.ts` completo (`veiculoFormSchema`) + Server Actions em `app/(app)/estoque/actions.ts`
- [x] Upload de fotos (Storage) com reordenação simples e foto de capa, URLs assinadas para bucket privado
- [x] Resumo de margem ao vivo usando `lib/domain/pricing.ts`
- [x] Bug corrigido: especificações numéricas chegavam como string ao zod (que não coage) — `especificacoesParaPayload()` converte antes de validar
- [x] Bug corrigido: loop de redirecionamento quando um JWT válido sobrevive a um profile removido (middleware agora verifica a existência do profile)
- [x] Testes E2E (Playwright): cadastro de moto, cadastro de carro, edição de veículo existente

## Fase 3 — Clientes básico (concluída)

- [x] Migration `clientes` (nome/cpf/whatsapp/email/cidade) + RLS + índice único parcial por CPF
- [x] `lib/validation/cliente.schema.ts` + `lib/data/clientes.ts` (busca por nome/CPF, sanitizada contra injeção de filtro `.or()`)
- [x] Tela `/clientes`: lista + busca via querystring + modal de cadastro rápido (`Dialog` + `useActionState`)
- [x] Bug corrigido: `formData.get()` retorna `null` (não `""`) pra campo ausente do form, quebrando validação zod opcional
- [x] Bug corrigido: lógica de fechar o modal após sucesso comparava um booleano derivado em vez do objeto de estado por identidade, e reabria/fechava o modal errado
- [x] Testes E2E (Playwright): cadastro pelo modal, busca por nome/CPF, rejeição de CPF duplicado

## Fase 4 — Nova venda (concluída)

- [x] Migration `vendas`/`venda_pagamentos`/`contratos_crediario`/`parcelas` + RLS + RPC transacional `fechar_venda(payload jsonb)`
- [x] `lib/domain/parcelas.ts` (`gerarParcelas`) — fórmula de juros simples validada lendo o código-fonte do protótipo, não os dados de exemplo (que não refletiam a fórmula real) + 4 testes vitest
- [x] `lib/validation/venda.schema.ts` + Server Action `fecharVenda` em `app/(app)/vendas/nova/actions.ts`
- [x] Wizard de 7 etapas (Veículo/Cliente/Negociação/Pagamento/Crediário/Documentos/Confirmação) em `components/features/vendas/nova/`
- [x] Decisão de escopo: sem auto-criação de veículo a partir da troca (fica pra tela dedicada de Avaliação/Troca, pós-MVP) e sem auto-cadastro silencioso de cliente balcão
- [x] Testes E2E (Playwright): venda à vista simples (cliente balcão), venda com crediário próprio + parcelas geradas, verificando banco (contrato/parcelas/status do veículo)

## MVP — próximas fases

- [ ] Fase 5 — Contas a receber (carnê, baixa de parcela com juros/multa, inadimplência) — precisa de `lib/domain/juros.ts`
- [ ] Fase 6 — Dashboard

## Pendências operacionais

- [ ] Configurar provedor SMTP próprio no Supabase (só relevante se algum fluxo futuro voltar a mandar e-mail)
- [ ] Configurar deploy (Vercel) + CI
- [ ] Painel administrativo do dono da plataforma (arquitetado; hoje é pré-requisito real pra provisionar clientes — sem autocadastro, é o único jeito de criar uma revenda nova)
- [ ] Tela `/vendas/realizadas` (listagem de vendas) — hoje só stub, a Nova venda já redireciona pra lá
