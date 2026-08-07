# Tier 4 pós-MVP: Leads, Propostas, Renegociação de contrato

Continuação da mesma sessão dos Tiers 1-3 (ver devtracks anteriores no mesmo
dia). Fecha o funil de vendas, com uma fase adiada a pedido do Enzo.

## Decisão do Enzo

**Fase 18 (Régua de cobrança automatizada via WhatsApp) — adiada, não
construída.** Perguntei semi-automática (sem custo novo) vs. automática de
verdade (precisa de WhatsApp Business API paga); o Enzo respondeu que não
pode arcar com isso agora e não quer a função. Não implementei nem a versão
semi-automática — ele disse "não quero essa função", não só "não posso
pagar a paga". Fica pra quando ele pedir.

## O que foi construído

### Fase 19 — Leads / CRM kanban (commit `4d62fd5`)
`/vendas/leads`: board kanban com 6 etapas (Novo, Em contato, Visita
agendada, Proposta enviada, Ganho, Perdido), card arrastável (@dnd-kit/core,
confirmado com o Enzo antes de adicionar a dependência) com atualização
otimista + rollback se a chamada ao servidor falhar. "Converter em venda"
num lead em Ganho reaproveita cliente já cadastrado (mesmo whatsapp) ou cria
um novo, e leva pro assistente de Nova venda com o cliente pré-selecionado.

**Mudança que serviu de base pras próximas duas fases**: Nova venda passou
a aceitar pré-seleção de cliente via `?clienteId=` na URL
(`estadoInicialNovaVenda` ganhou parâmetro opcional).

### Fase 20 — Propostas (commit `aed4c86`)
`/vendas/propostas`: cadastro (veículo, cliente cadastrado ou nome avulso,
valor, condições, validade), marcar aceita/recusada, "Converter em venda".

**Decisão perguntada ao Enzo antes de implementar** (o guia exigia): PDF ou
só registro na tela? Ele escolheu **PDF de verdade** —
`@react-pdf/renderer` (nova dependência), botão "Baixar PDF" gera o Blob
inteiramente no navegador, sem rota de servidor nova.

Estendi a pré-seleção da Fase 19 pra também aceitar `?veiculoId=` e
`?valorVenda=`, então "Converter em venda" de uma proposta pré-preenche os
três de uma vez.

### Fase 21 — Renegociação de contrato (commit `6fa5f18`)
Botão "Renegociar" real na visão "Por contrato" de Contas a receber — o
botão do protótipo original **não existia mais no código atual**, então foi
implementado do zero, não uma substituição de stub (a premissa do guia
estava desatualizada, registrando aqui pra você saber). Dialog com prévia
do carnê (reaproveita `gerarParcelas`, já testado) antes de confirmar.

Nova RPC `renegociar_contrato`, mesmo estilo atômico de `fechar_venda`:
marca parcelas não pagas do contrato atual como "Renegociada" (mantém
histórico) e cria um contrato novo (ligado ao anterior via
`contrato_anterior_id`) com o carnê renegociado.

## Pendência que precisa de você (Enzo)

**Duas migrations novas, ainda não aplicadas** (as 4 anteriores seguem
pendentes também — nenhuma nova foi aplicada desde o relatório do Tier 3):
1. `0014_fase19_leads.sql`
2. `0015_fase20_propostas.sql`
3. `0016_fase21_renegociacao.sql`

Junto com as 3 pendentes desde os Tiers 2/3: `0010_fase13_comissoes.sql`,
`0011_fase15_consignados.sql`, `0012_fase16_fornecedores.sql`,
`0013_fase17_marcas_modelos.sql`. **Total: 7 migrations aguardando**, na
ordem 0010 → 0016.

## Testes

- Typecheck, lint, build: limpos em todo commit.
- Unit (Vitest): 50/50, sem mudança nesta sessão.
- E2E (Playwright): 43 specs no total agora (3 novos: fase19, fase20,
  fase21). 35/43 passando — as 8 falhas restantes são exatamente as 7
  migrations pendentes acima (uma delas, Fase 15, já vinha de antes) mais o
  padrão já conhecido, confirmado isolando a causa raiz em cada uma.
- Nenhuma regressão nova nesta sessão — Fase 4 (Nova venda) e Fase 5
  (Contas a receber), ambas tocadas por essas fases, seguem verdes.

## Estado do roadmap após esta sessão

Tier 0 (deploy) segue esperando o Enzo. Tier 1 100% funcional. Tiers 2, 3 e
4 prontos do lado do código, esperando as 7 migrations pendentes listadas
acima. Fase 18 (régua WhatsApp) fica pra quando o Enzo quiser retomar.
Próximo: **Tier 5** (cauda longa) — Relatórios/PDF, Configurações da loja,
Permissões avançadas, Integrações reais, PWA, Billing, SMTP. Quase toda fase
do Tier 5 tem uma decisão de negócio explícita pra confirmar antes de
começar (o guia é bem claro sobre isso) — inclusive alguns itens (ex.:
Billing, SMTP) o guia recomenda nem começar sem um gatilho real de negócio
(mais revendas clientes, um fluxo que passe a depender de e-mail).
