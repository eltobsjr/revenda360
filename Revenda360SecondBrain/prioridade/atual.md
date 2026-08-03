# Prioridade atual — Revenda360

Atualizado em 2026-08-03.

## Agora (próximo passo)

**MVP completo — todas as 6 fases do plano original estão implementadas.**
Não há mais uma "próxima fase" na sequência original. Os itens abaixo (pós-MVP e fora da sequência) são os candidatos para a próxima frente de trabalho — o painel administrativo do dono da plataforma é o mais urgente, por ser hoje o único bloqueio para provisionar uma revenda cliente de verdade.

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

## Pós-MVP (documentado, não priorizado ainda)

- Clientes completo, Avaliação/Troca dedicada, Consignados, Fornecedores
- Contas a pagar, Fluxo de caixa, Comissões, DRE por veículo
- Régua de cobrança automatizada via WhatsApp — hoje existe só o link manual `wa.me` (Fase 5), sem cadência/automação
- Leads/CRM kanban, permissões avançadas, Configurações da loja, Relatórios, PDF
- Integrações reais (FIPE, placa/Renavam, WhatsApp Business API, portais), billing do SaaS, otimização de RLS via JWT claims, PWA
- Tela `/vendas/realizadas` (listagem de vendas) — hoje só stub; a Nova venda já redireciona pra lá
- Renegociação de contrato de crediário — botão "Renegociar" na tela de Inadimplência (Fase 5) existe só no protótipo como toast, sem funcionalidade real; não implementado

## Fora da sequência de fases (esperando o usuário decidir quando)

- **Painel administrativo do dono da plataforma** (arquitetado, não implementado) — não é mais só "legal ter": autocadastro público foi removido (2026-08-01), então é o único jeito de provisionar uma revenda cliente de verdade. Enquanto não existe, provisionamento é manual (SQL direto/curl no Supabase, como fiz para debug). Com o MVP de fases completo, este é o candidato mais forte a próxima frente de trabalho.
- SMTP próprio no Supabase — só relevante se algum fluxo futuro voltar a mandar e-mail (ex.: convite de acesso); não é mais bloqueante do jeito que era com o autocadastro.
- Deploy/CI

## Regras fixas para toda fase daqui em diante

- Toda tela nova nasce com teste E2E Playwright.
- Ajuste de design sempre nos componentes compartilhados, nunca só numa tela.
- Nunca incluir "Co-Authored-By: Claude" nos commits.
- **Atualizado 2026-08-01**: usuário mudou a regra de commit — agora é "ao terminar uma fase, commita, pusha, e já começa a próxima" (sem precisar pedir permissão a cada vez). Isso substitui a regra antiga de "nunca commitar sem permissão explícita".
