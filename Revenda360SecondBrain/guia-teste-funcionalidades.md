# Guia de teste — funcionalidades atuais do Revenda360

Cobre tudo que já está construído e funcionando (Fases 0-6 + painel
administrativo). Pra testar o que ainda falta ser construído, use
`Revenda360SecondBrain/prioridade/guia-construcao-enzo.md`.

## Logins de teste

Revenda de demonstração ("Revenda Demo"), já com estoque, clientes e vendas de
exemplo (uma à vista, uma em crediário com parcela paga/atrasada/a vencer, pra
já nascer com dado real pra olhar). Login em `/login`:

| Papel | E-mail | Senha |
|---|---|---|
| Gestor (vê tudo, inclusive financeiro) | `demo.gestor@revenda360.app` | `***SENHA-REMOVIDA-DO-HISTORICO***` |
| Vendedor (sem dado financeiro sensível) | `demo.vendedor@revenda360.app` | `***SENHA-REMOVIDA-DO-HISTORICO***` |
| Financeiro | `demo.financeiro@revenda360.app` | `***SENHA-REMOVIDA-DO-HISTORICO***` |

Se quiser resetar os dados de demonstração pro estado inicial (ex.: antes de
uma apresentação), rode `node scripts/local-seed-demo-tenant.mjs` — apaga e
recria a revenda demo do zero.

## O que testar, por role

### Como gestor (`demo.gestor@revenda360.app`)

1. **Dashboard** — confira os KPIs (estoque, vendas do mês, a receber,
   inadimplência, lucro líquido, margem média), o gráfico de 12 meses, aging
   de estoque, mix carro×moto, top modelos e últimas movimentações.
2. **Estoque** — lista de veículos, busca por marca/modelo/placa, abra a
   ficha de um veículo (abas Resumo/Financeiro/Mídia) — confira que preço
   mínimo e custo aparecem (só gestor vê isso).
3. **Entrada de veículo** (`Estoque > Novo`) — cadastre um veículo de teste
   pelo assistente completo.
4. **Clientes** — lista, busca, cadastro rápido de cliente novo.
5. **Nova venda** (`Vendas > Nova venda`) — rode o assistente completo (7
   etapas) pra uma venda de teste, incluindo pelo menos uma vez com
   crediário, pra gerar parcelas.
6. **Financeiro > Contas a receber** — veja as 3 visões (parcelas, contratos,
   inadimplência). Na parcela em atraso do dado de exemplo, teste o botão de
   dar baixa (com juros/multa calculado automático) e o botão "Cobrar"
   (abre link do WhatsApp já com a mensagem preenchida).
7. **Equipe** — cadastre um membro novo (vendedor ou financeiro), confira que
   recebe senha temporária gerada.

### Como vendedor (`demo.vendedor@revenda360.app`)

Repita o Dashboard e a Ficha de um veículo — confirme que **nenhum dado
sensível aparece** (preço mínimo, custo de aquisição, margem, lucro líquido,
comissão). Se algum desses valores aparecer pro vendedor, é bug — me avise.

### Como financeiro (`demo.financeiro@revenda360.app`)

Confira acesso ao módulo financeiro (Contas a receber) e ausência dos mesmos
dados sensíveis de estoque/margem que o vendedor também não vê.

### Painel administrativo (só o dono da plataforma, não é o login demo acima)

`/admin` — lista de revendas provisionadas e formulário de nova revenda
(cria tenant + loja + gestor de uma vez, com senha temporária gerada). É o
que usamos pra provisionar cada cliente real.

## Testes automáticos (se quiser rodar você mesmo, opcional)

```bash
npm run test        # testes unitários (regra de negócio pura)
npx playwright test # testes E2E (fluxo completo simulando o navegador)
```
