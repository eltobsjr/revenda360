# Guia de construção — Revenda360 pós-MVP (pra Enzo seguir com o Claude Code)

Este guia existe porque você (Enzo) vai construir as próximas fases do Revenda360
usando o Claude Code, sem precisar programar. Cada fase abaixo tem um **prompt
pronto pra colar**, já com todo o contexto técnico que o Claude precisa. Você só
precisa colar, deixar o Claude trabalhar, e depois seguir o checklist de teste
manual (clicando na tela, sem código) pra confirmar que ficou certo antes de ir
pra próxima fase.

## Como usar

1. Abra um terminal na pasta do projeto e rode `claude` (ou continue uma sessão
   já aberta) — o Claude Code já lê `CLAUDE.md` e `AGENTS.md` sozinho, não
   precisa colar nada além do prompt da fase.
2. **Siga a ordem** (Fase 7 → Fase 28). Muita fase depende de tabela/tela que a
   fase anterior criou — pular ordem pode travar o Claude no meio.
3. Cole o prompt inteiro da fase (o bloco cinza), aperte enter, deixe trabalhar.
4. Quando o Claude disser que terminou, rode o "checklist de teste manual" da
   fase — são passos de clicar na tela, não de programar.
5. Se alguma migration `.sql` nova foi criada (`supabase/migrations/000X_*.sql`),
   você precisa copiar o conteúdo dela e rodar no **SQL Editor do Supabase**
   manualmente (não tem CLI conectada nesse projeto) — o Claude vai avisar
   quando isso acontecer.
6. Se algo no checklist não bater, volte pro Claude e descreva o que viu
   ("a tela abre mas o botão X não faz nada", "apareceu erro Y") — não tente
   consertar sozinho, é pra isso que ele está aqui.
7. Só marque a fase como concluída e vá pra próxima depois que o checklist
   inteiro passar.

Se o Claude perguntar algo que você não sabe responder com certeza (regra de
negócio, fórmula, texto exato de um campo), é normal — pense na resposta como
dono do negócio, não como programador. Se travar, me chama.

## Bloco de regras (cole isso junto com o prompt de cada fase — já está embutido nos prompts abaixo, mas é o mesmo texto sempre)

```
Regras fixas deste projeto (não pule nenhuma):
- REGRA SUPREMA, acima de qualquer outra: segurança de dados vem antes de
  velocidade. Se em algum momento "seguir rápido" e "proteger dado" entrarem
  em conflito, vence proteger dado — mesmo que isso signifique parar e
  perguntar em vez de terminar a fase no mesmo dia.
- Multi-tenant: toda tabela nova precisa de tenant_id + RLS usando a policy
  current_tenant_id() (ver padrão em qualquer migration existente em
  supabase/migrations/) já na mesma migration que cria a tabela — nunca
  "depois eu arrumo a RLS".
- Dado sensível (preço mínimo, margem, custo de aquisição/valor de compra,
  comissão, qualquer dado financeiro interno) só aparece pra role "gestor" —
  filtrar em lib/data/*, nunca só esconder no componente visual.
- Ajuste de design (cor, espaçamento, tipografia, altura de campo) sempre nos
  componentes compartilhados (components/ui/*, app/globals.css), nunca só
  numa tela isolada.
- Toda tela nova nasce com teste E2E Playwright, seguindo o padrão de
  e2e/fase5-contas-receber.spec.ts (usa os helpers de Admin API em
  e2e/helpers/admin.ts pra preparar dados de teste, sem depender de e-mail
  real).
- Migration nova é um arquivo .sql em supabase/migrations/, numerado depois
  do último existente. NÃO aplica sozinho no banco — só cria o arquivo e avisa
  que precisa ser rodado manualmente no SQL Editor do Supabase.
- Antes de considerar a fase pronta: rodar typecheck + lint + build + testes
  (vitest e e2e) e só commitar se tudo passar limpo. Pode commitar e pushar
  sem pedir permissão a cada vez, desde que essa verificação passe — EXCETO
  se a mudança tocar segurança (RLS, autenticação, autorização, exposição de
  dado sensível, segredo/senha/chave): nesse caso, mesmo com tudo passando,
  pare e descreva o que vai mudar antes de commitar, pra o Enzo confirmar.
- Ao final da fase, gerar/atualizar o devtrack da sessão em
  Revenda360SecondBrain/devtrack/, seguindo o padrão dos devtracks
  existentes.
- Se alguma regra de negócio não estiver clara (fórmula, campo obrigatório,
  texto exato de mensagem, o que conta como "vencido" etc.), PARE e pergunte
  ao Enzo antes de inventar um comportamento.
```

---

## Tier 0 — bloqueia vender pra qualquer revenda real

### Fase 7 — Deploy/CI

**Por que importa:** hoje o Revenda360 só roda na sua máquina. Nenhum cliente
consegue acessar o sistema até isso existir — é o item mais urgente de todos,
antes até de continuar construindo tela nova.

**Isso aqui tem uma parte que só você faz (fora do Claude), veja abaixo.**

#### Parte 1 — você faz sozinho, fora do Claude (conta em site, não é código)

1. Crie uma conta em [vercel.com](https://vercel.com) (dá pra logar com sua
   conta do GitHub direto).
2. "Add New Project" → conecte o repositório `eltobsjr/revenda360`.
3. Quando pedir as variáveis de ambiente, copie as mesmas chaves que estão no
   seu `.env.local` local (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `NEXT_PUBLIC_SITE_URL` — essa última vai ser a URL que a Vercel te dar,
   ex.: `https://revenda360.vercel.app`, ajusta depois do primeiro deploy).
4. Clique em Deploy. Se falhar, volte aqui e cole a mensagem de erro pro
   Claude — é aí que a Fase 7 dele (parte 2, abaixo) entra: garantir que o
   build da Vercel funcione de primeira.

#### Parte 2 — prompt pra colar no Claude Code

```
Preciso deixar o Revenda360 pronto pra deploy na Vercel e com verificação
automática (CI) rodando a cada push no GitHub.

O que preciso que você faça:
1. Confira se o projeto builda limpo (npm run build) e resolva qualquer coisa
   que dependa de caminho absoluto de máquina local, variável de ambiente sem
   fallback, ou qualquer coisa que só funcione localmente.
2. Crie um workflow do GitHub Actions em .github/workflows/ci.yml que, a cada
   push e pull request pra main, rode nesta ordem: npm ci, typecheck
   (tsc --noEmit), lint (npm run lint), testes unitários (npm run test -- --run)
   e build (npm run build). Se qualquer passo falhar, o workflow tem que
   falhar (não seguir escondendo erro).
3. NÃO rode os testes E2E (Playwright) no CI ainda — eles dependem de um banco
   Supabase real configurado, que não está disponível no ambiente do GitHub
   Actions. Deixe isso documentado como TODO no próprio workflow, comentado.
4. Confira o next.config.ts (turbopack.root) e o middleware pra garantir que
   nada assume localhost/porta fixa.
5. Documente em Revenda360SecondBrain/devtrack/ o que foi feito, incluindo um
   lembrete de que o deploy em si (criar conta Vercel, conectar repo,
   configurar env vars) é feito manualmente pelo Enzo direto no site da
   Vercel — isso não dá pra automatizar por aqui.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] `https://<seu-projeto>.vercel.app/login` abre e mostra a tela de login.
- [ ] Login com a conta de dono da plataforma funciona e leva pra `/admin`.
- [ ] Criar uma revenda de teste pelo `/admin` funciona igual funciona local.
- [ ] No GitHub, aba "Actions" do repositório, o workflow novo aparece rodando
      a cada push e fica verde.

---

## Tier 1 — buracos no ciclo que já está em uso

### Fase 8 — Vendas realizadas

**Por que importa:** hoje dá pra vender pelo assistente de Nova venda, mas não
existe onde ver a lista do que já foi vendido. É a lacuna mais estranha do
sistema hoje.

```
Preciso construir a tela "Vendas realizadas" em app/(app)/vendas/realizadas/
(hoje é só um stub — components/stub-screen.tsx). A tela de Nova venda já
redireciona pra cá depois de fechar uma venda.

O que a tela precisa ter:
- Lista de vendas (tabela public.vendas), mais recente primeiro: veículo
  (marca/modelo/placa), cliente (ou "Cliente balcão" quando cliente_nome_avulso
  em vez de cliente_id), vendedor, data da venda, valor final, status
  (confirmada/cancelada).
- Filtro por período (data inicial/final) e por status.
- Campos sensíveis (comissao_valor, comissao_pct) só aparecem pra role
  "gestor" — siga o mesmo padrão de ocultação já usado em
  lib/data/veiculos.ts (listVeiculosComFinanceiro) e lib/data/contas-receber.ts.
- Clique numa linha abre um detalhe (pode ser um dialog, não precisa ser
  página nova) mostrando a composição do pagamento — join com
  venda_pagamentos (tipo: dinheiro/pix/cartao/transferencia/troca/
  financiamento_bancario/crediario).

Antes de implementar, leia lib/data/contas-receber.ts e
lib/data/veiculos.ts (listVeiculosComFinanceiro) pra seguir o mesmo estilo de
função de leitura com filtragem por role. Leia também
components/features/dashboard/movimentacoes-card.tsx — o Dashboard já lista
vendas recentes num formato parecido, reaproveite o que fizer sentido.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] `/vendas` no menu → "Vendas realizadas" não é mais um placeholder.
- [ ] Faz uma venda de teste pelo assistente de Nova venda e ela aparece na
      lista logo em seguida.
- [ ] Logado como vendedor (não gestor), a coluna/valor de comissão não
      aparece em lugar nenhum da tela.
- [ ] Filtro de período funciona (bate uma data que exclui a venda de teste e
      ela some da lista).

---

### Fase 9 — Avaliação / Troca

**Por que importa:** o assistente de Nova venda já aceita veículo na troca
(fica registrado em `venda_pagamentos` com `tipo = 'troca'`), mas foi decisão
deliberada na Fase 4 **não** criar esse veículo no estoque automaticamente —
ficou pendente pra esta tela dedicada. Sem ela, todo carro que a revenda
recebeu na troca existe fisicamente no pátio mas não existe no sistema.

```
Preciso construir a tela "Avaliação / Troca" em
app/(app)/estoque/avaliacao-troca/ (hoje é só um stub).

Antes de escrever qualquer código, investigue e me diga o que encontrou:
1. Como o assistente de Nova venda (components/features/vendas/) captura hoje
   os dados do veículo dado na troca quando o pagamento é tipo "troca" — que
   campos ficam salvos em venda_pagamentos.detalhes (é um jsonb)? Marca,
   modelo, placa, valor? Ou é só um valor solto sem detalhe do veículo?
2. Consulte Revenda360SecondBrain/CHECKLIST.md e as decisões em
   Revenda360SecondBrain/decisions/ sobre a Fase 4 — tem uma nota explícita
   sobre essa decisão de escopo, leia pra entender o que já foi decidido.

Com isso levantado, me proponha (antes de implementar) como ligar as duas
pontas: a tela precisa listar os pagamentos tipo "troca" que ainda não viraram
um veículo no estoque, e permitir completar o cadastro completo do veículo
recebido (reaproveitando o máximo possível do assistente de Entrada de veículo
da Fase 2 — não duplique o formulário do zero) — a origem desse veículo deve
ficar marcada como "troca", ligada de volta ao pagamento que a originou (isso
provavelmente precisa de uma coluna nova em veiculos, tipo
origem_troca_pagamento_id, nullable, com FK pra venda_pagamentos — mas
confirme comigo o nome/abordagem antes de criar a migration se tiver qualquer
dúvida).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Faça uma venda de teste no assistente de Nova venda usando "troca" como
      forma de pagamento (mesmo que parcial).
- [ ] Abra `/estoque/avaliacao-troca` — o veículo dado na troca aparece como
      pendente de completar cadastro.
- [ ] Complete o cadastro — o veículo passa a aparecer na listagem normal de
      `/estoque`.
- [ ] Depois de completar, ele some da lista de "pendentes" da tela de
      Avaliação/Troca.

---

### Fase 10 — Clientes completo

**Por que importa:** hoje `/clientes` só lista, busca e cria rápido. Não tem
ficha — não dá pra ver o histórico de compras de um cliente específico.

```
Preciso completar a tela de Clientes com uma ficha do cliente em
app/(app)/clientes/[id]/ (hoje só existe app/(app)/clientes/page.tsx com
lista + busca + criação rápida via
components/features/clientes/cliente-quick-create.tsx).

A ficha do cliente precisa ter, em abas — siga exatamente o mesmo padrão
visual/estrutural da Ficha do veículo (app/(app)/estoque/[id]/, componentes em
components/features/estoque/ficha/: resumo-tab.tsx, financeiro-tab.tsx,
midia-tab.tsx — leia esses arquivos antes de começar):
- Aba "Dados": todos os campos de public.clientes, editáveis (mesmo padrão de
  salvar de components/features/estoque/ficha, se existir; senão siga o
  padrão de app/(app)/equipe/actions.ts pra um form + server action simples).
- Aba "Histórico de compras": lista de public.vendas onde cliente_id é este
  cliente, mais recente primeiro — veículo, data, valor final, status.
- Aba "Financeiro": parcelas relacionadas a esse cliente via
  contratos_crediario (reaproveite lib/data/contas-receber.ts, já tem
  listParcelas) — separadas por status (a vencer / pagas / atrasadas), sem
  duplicar a lógica que já existe lá.

Clicar numa linha da lista de /clientes precisa levar pra
/clientes/[id]. Nenhum dado sensível de venda (comissão) aparece aqui pra
quem não é gestor — mesmo critério das outras telas.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Clicar num cliente na lista abre a ficha dele.
- [ ] Editar um campo (ex.: WhatsApp) na aba Dados e salvar reflete na lista
      principal também.
- [ ] Um cliente que já tem venda registrada mostra ela na aba Histórico.
- [ ] Um cliente com parcela em atraso mostra isso na aba Financeiro.

---

### Fase 11 — Contas a pagar

**Por que importa:** o módulo Financeiro hoje só enxerga o que entra (Contas a
receber, Fase 5). Metade da gestão financeira de uma revenda — o que ela deve
— não existe ainda.

```
Preciso construir "Contas a pagar" em app/(app)/financeiro/pagar/ (hoje é só
stub), espelhando de perto a estrutura de Contas a receber
(app/(app)/financeiro/receber/, lib/data/contas-receber.ts, migration
supabase/migrations/0006_fase5_contas_receber.sql) — leia esses arquivos
inteiros antes de começar, é o padrão a seguir.

O que preciso:
1. Nova migration (supabase/migrations/0008_contas_pagar.sql) com uma tabela
   contas_pagar: tenant_id, descricao, categoria (texto livre por enquanto —
   a tela de Fornecedores estruturada é uma fase futura, não trave nisso),
   fornecedor (texto livre, mesmo padrão hoje usado em veiculos.fornecedor),
   valor, vencimento (date), status (mesmo enum de conceito de
   StatusParcela: "A vencer" | "Paga" | "Atrasada" | "Parcial" — reaproveite o
   nome se fizer sentido), valor_pago, data_pagamento, forma_pagamento. RLS
   com current_tenant_id(), igual toda tabela nova.
2. Tela com lista (filtro por status, igual a Contas a receber tem 3 visões),
   formulário de cadastro de conta nova, e ação de "dar baixa" (pagar) —
   reaproveite lib/domain/juros.ts (calcularDiasAtraso já é genérico, não é
   específico de parcela de venda — confira antes de duplicar) pra saber o
   que está atrasado.
3. Dado sensível: o valor de contas a pagar é informação financeira interna —
   a tela inteira só aparece pra role gestor e financeiro (não vendedor) —
   confirme o critério de role certo olhando como as outras telas do
   Financeiro fazem o gate de acesso (ex.: app/(app)/financeiro/receber/).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor do Supabase antes de testar.
- [ ] Cadastrar uma conta a pagar de teste (ex.: aluguel, vencendo amanhã) e
      ela aparece na lista "A vencer".
- [ ] Cadastrar uma conta com vencimento no passado aparece como "Atrasada".
- [ ] Dar baixa numa conta muda o status pra "Paga" e ela sai da lista de
      pendentes.
- [ ] Logado como vendedor, a tela de Contas a pagar não aparece no menu (ou
      bloqueia acesso direto pela URL).

---

## Tier 2 — fecha o módulo financeiro

### Fase 12 — Fluxo de caixa

**Por que importa:** com Contas a pagar (Fase 11) e Contas a receber (Fase 5)
já existindo, dá pra montar a visão completa de entra-e-sai de dinheiro — hoje
não existe em lugar nenhum.

```
Preciso construir "Fluxo de caixa" em app/(app)/financeiro/fluxo-caixa/ (hoje
é stub).

A tela mostra, por mês (últimos 12 meses, igual ao gráfico do Dashboard —
leia lib/domain/dashboard.ts, a função agruparVendasPorMes já resolve o
"bucket de 12 meses com zero-fill", reaproveite o mesmo padrão em vez de
reescrever):
- Entradas: parcelas pagas (contratos_crediario/parcelas, data_pagamento
  dentro do mês) + vendas à vista (venda_pagamentos com tipo diferente de
  "crediario" e "troca", ligadas a vendas confirmadas).
- Saídas: contas_pagar pagas (Fase 11, data_pagamento dentro do mês) + custos
  de veículo lançados (custos_veiculo, data dentro do mês).
- Saldo do mês e saldo acumulado.

Tela só visível pra gestor e financeiro (mesmo critério de Contas a pagar).
Puramente leitura agregada, sem tabela nova — se notar que precisa de tabela
nova, pare e me pergunte antes, pode ser sinal de que a Fase 11 não cobriu
algo que eu preciso saber.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] O mês onde você deu baixa numa conta a pagar de teste (Fase 11) mostra
      essa saída.
- [ ] O mês de uma parcela paga (Fase 5) mostra essa entrada.
- [ ] Saldo acumulado soma corretamente mês a mês.

---

### Fase 13 — Comissões

**Por que importa:** `vendas.comissao_valor` já é calculado e gravado em toda
venda desde a Fase 4, mas não existe tela nenhuma pra gestor ver/gerenciar o
que deve de comissão pra cada vendedor.

```
Preciso construir "Comissões" em app/(app)/financeiro/comissoes/ (hoje é
stub).

A tela lista, por vendedor, o total de comissao_valor de vendas confirmadas
num período (filtro de mês), com um jeito de marcar como "paga" — isso precisa
de um campo novo em vendas (ex.: comissao_paga boolean default false,
comissao_data_pagamento date nullable) via nova migration
(supabase/migrations/0009_comissoes.sql) — antes de criar a migration, me
confirme se prefere isso ou uma tabela separada comissoes_pagamentos (mais
flexível se um dia quiser pagar comissão em parcelas, mas mais complexa) —
pare e pergunte, não escolha sozinho.

Visão: agrupado por vendedor, com total pago e total pendente do período,
expansível pra ver as vendas individuais que compõem o total. Só visível pra
gestor (é dado de custo/remuneração interna).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Uma venda de teste confirmada aparece somada na comissão pendente do
      vendedor certo.
- [ ] Marcar como paga tira do "pendente" e some ao "pago" do período.
- [ ] Logado como vendedor, a tela de Comissões não aparece / não abre.

---

### Fase 14 — DRE por veículo

**Por que importa:** o Dashboard já calcula lucro líquido agregado
(`lucro = valor_final − custo_total(veículo) − comissao_valor`, em
`lib/data/dashboard.ts`). Esta fase é a mesma conta, mas detalhada
veículo por veículo, não só o total.

```
Preciso construir "DRE por veículo" em app/(app)/financeiro/dre/ (hoje é
stub).

Reaproveite exatamente a fórmula de lucro já usada no Dashboard
(lib/data/dashboard.ts e lib/domain/pricing.ts/dashboard.ts — leia antes de
reescrever a fórmula do zero, ela já existe e já é testada). A diferença é que
aqui cada veículo vendido é uma linha: preço de venda, custo de aquisição
(valor_compra), soma de custos_veiculo lançados, comissão paga, margem em R$ e
em %. Filtro por período de venda.

Tela 100% gestor (é a informação financeira mais sensível que existe no
sistema — nem financeiro/vendedor veem).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Uma venda de teste com custo e comissão conhecidos aparece com a margem
      certa (confira a conta de cabeça pra um caso simples).
- [ ] Soma das linhas bate com o "Lucro líquido" do Dashboard pro mesmo
      período.
- [ ] Logado como financeiro ou vendedor, a tela não abre.

---

## Tier 3 — completa o catálogo de estoque

### Fase 15 — Consignados

**Por que importa:** `veiculos.status` já aceita o valor `"Consignado"`, mas
não existe nenhum lugar que registre quem é o consignante, o valor de repasse
combinado, ou a comissão da revenda sobre a venda de um veículo consignado.

```
Preciso construir a tela "Consignados" em app/(app)/estoque/consignados/ (hoje
é stub) e o modelo de dados por trás.

Antes de implementar: leia lib/domain/pricing.ts e o assistente de Entrada de
veículo (Fase 2, components/features/estoque/entrada/) pra entender como um
veículo normal é cadastrado — o veículo consignado usa a mesma tabela
veiculos (status = "Consignado"), só precisa de dados extras do consignante.

Nova migration (supabase/migrations/0010_consignados.sql): tabela
consignacoes (tenant_id, veiculo_id FK pra veiculos, consignante_nome,
consignante_contato, valor_repasse_consignante, comissao_revenda — decida
comigo se é percentual ou valor fixo antes de criar a coluna, pergunte se não
tiver certeza) — RLS com current_tenant_id() igual sempre.

Fluxo: o assistente de Entrada de veículo (Fase 2) ganha um toggle "veículo é
consignado?" — se marcado, pede os dados do consignante e cria a linha em
consignacoes junto com o veículo. A tela /estoque/consignados lista os
consignados ativos e, quando um é vendido, mostra quanto vai pro consignante x
quanto fica de comissão pra revenda (isso deve aparecer também na Fase 14, DRE
por veículo, e na Fase 12, Fluxo de caixa — se essas fases já estiverem
prontas, atualize-as pra considerar consignação; se não fiz elas ainda, apenas
me avise que ficou pendente integrar).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Cadastrar um veículo consignado de teste pelo assistente de Entrada —
      aparece em `/estoque/consignados` com os dados do consignante.
- [ ] Vender esse veículo mostra a divisão repasse/comissão em algum lugar
      visível (a própria tela de consignados, ou a ficha da venda).

---

### Fase 16 — Fornecedores

**Por que importa:** hoje `veiculos.fornecedor` é um campo de texto livre —
sem tabela própria, sem histórico de quantos veículos vieram de cada
fornecedor, sem dado de contato centralizado.

```
Preciso construir "Fornecedores" em app/(app)/fornecedores/ (hoje é stub).

Nova migration (supabase/migrations/0011_fornecedores.sql): tabela
fornecedores (tenant_id, nome, contato, cnpj_cpf nullable, observacoes,
criado_em) com RLS current_tenant_id(). NÃO apague ou migre à força o campo
veiculos.fornecedor (texto livre) que já existe — ele fica como está por
enquanto, pra não quebrar veículos já cadastrados. Em vez disso: no
assistente de Entrada de veículo (Fase 2), troque o campo de texto livre de
fornecedor por um select que busca em fornecedores (com opção "cadastrar
novo" direto ali, sem sair da tela) — mas mantenha compatibilidade: se um
veículo antigo só tem o texto livre preenchido (sem fornecedor_id), a ficha
dele continua mostrando esse texto normalmente.

Tela /fornecedores: lista simples com nome, contato, quantos veículos vieram
de cada um (contagem em veiculos), cadastro/edição.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Cadastrar um fornecedor de teste em `/fornecedores`.
- [ ] No assistente de Entrada de veículo, esse fornecedor aparece pra
      selecionar.
- [ ] Um veículo antigo (cadastrado antes desta fase) continua mostrando o
      fornecedor de texto livre normalmente na ficha, sem quebrar.

---

### Fase 17 — Marcas / Modelos

**Por que importa:** `veiculos.marca` e `veiculos.modelo` são texto livre hoje
— sem padronização, "Volkswagen Gol" e "VW Gol" viram dois valores diferentes
em relatórios e filtros.

```
Preciso construir "Marcas / Modelos" em app/(app)/marcas-modelos/ (hoje é
stub) — um catálogo estruturado.

Nova migration (supabase/migrations/0012_marcas_modelos.sql): tabelas marcas
(tenant_id, nome) e modelos (tenant_id, marca_id FK, nome) com RLS
current_tenant_id(). Mesma lógica de compatibilidade da Fase 16: NÃO force
migração dos veiculos.marca/modelo já cadastrados (continuam texto livre como
estão); o assistente de Entrada de veículo passa a oferecer um select
alimentado por marcas/modelos com opção de cadastrar um novo ali mesmo, sem
sair da tela.

Tela /marcas-modelos: gerenciar o catálogo (adicionar marca, adicionar modelo
dentro de uma marca, editar/desativar).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Cadastrar uma marca e um modelo dentro dela em `/marcas-modelos`.
- [ ] No assistente de Entrada de veículo, esse modelo aparece pra selecionar.
- [ ] Um veículo antigo continua mostrando marca/modelo normalmente.

---

## Tier 4 — funil de vendas

### Fase 18 — Régua de cobrança automatizada via WhatsApp

**Por que importa:** hoje (Fase 5) já existe um botão "Cobrar" que abre um
link `wa.me` pronto — mas é sempre uma ação manual, sem cadência.

**Antes de colar o prompt, decida uma coisa** (o Claude vai perguntar, mas é
mais rápido já saber a resposta): você quer (a) só melhorar a tela pra
agrupar/sugerir quando cobrar cada cliente (continua manual, você clica pra
enviar), ou (b) mandar mensagem sozinho sem ninguém clicar? A opção (b)
precisa de WhatsApp Business API paga + um servidor rodando tarefa agendada —
é bem mais caro e complexo, e o projeto decidiu explicitamente evitar isso até
agora ("sem API paga"). Recomendo começar pela opção (a).

```
Preciso melhorar a régua de cobrança em cima do que já existe na tela de
Inadimplência (app/(app)/financeiro/receber/, componente
InadimplenciaTable, lib/domain/whatsapp.ts — leia antes de mexer).

Escopo (opção "semi-automática", sem mandar mensagem sozinho — se eu disse
que quero automação de verdade com envio sem clique, PARE e me pergunte antes,
isso muda a fase inteira): agrupar os clientes inadimplentes em faixas de
atraso com um template de mensagem diferente por faixa (ex.: 1-15 dias, tom
de lembrete; 16-30, mais direto; 30+, tom de negociação) — gerando o link
wa.me com o texto certo pra cada faixa automaticamente, sem precisar digitar
mensagem toda vez. Adicione também um indicador de "já cobrado hoje" (campo
novo em parcelas ou numa tabela cobrancas_log, sua escolha, mas pare e me
avise qual optou) pra não cobrar o mesmo cliente duas vezes sem querer.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Um cliente com 20 dias de atraso de teste mostra um template de
      mensagem diferente de um com 3 dias.
- [ ] Depois de clicar em "Cobrar", o sistema lembra que esse cliente já foi
      cobrado hoje.

---

### Fase 19 — Leads (CRM kanban)

**Por que importa:** hoje não existe nenhum controle de gente interessada em
comprar antes de virar venda de fato — só existe o cliente já cadastrado numa
venda.

```
Preciso construir "Leads" em app/(app)/vendas/leads/ (hoje é stub) — um board
kanban.

Antes de implementar, confira se o projeto já tem alguma lib de
drag-and-drop instalada (procure em package.json por "dnd", "dnd-kit",
"react-beautiful-dnd" etc.) — se não tiver, PARE e me pergunte antes de
adicionar uma dependência nova ao projeto, não decida sozinho qual biblioteca
usar.

Nova migration (supabase/migrations/0013_leads.sql): tabela leads (tenant_id,
nome, contato/whatsapp, origem — texto livre tipo "Instagram", "Indicação",
"OLX" —, veiculo_interesse_id nullable FK pra veiculos, vendedor_id, etapa
— proponha um enum razoável tipo "Novo" / "Em contato" / "Visita agendada" /
"Proposta enviada" / "Ganho" / "Perdido", mas confirme comigo antes de travar
o enum na migration, é fácil de ficar errado na primeira tentativa —,
observacoes, criado_em). RLS current_tenant_id().

Tela kanban: uma coluna por etapa, cards arrastáveis entre colunas, criar
lead novo, e um botão "Converter em venda" num lead na etapa "Ganho" que leva
pro assistente de Nova venda já com o cliente pré-preenchido (crie o cliente
em public.clientes se ainda não existir).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Criar um lead de teste, arrastar entre pelo menos duas etapas.
- [ ] Mover um lead pra "Ganho" e converter em venda pré-preenche o cliente
      no assistente de Nova venda.

---

### Fase 20 — Propostas

**Por que importa:** hoje uma negociação não tem registro formal antes de
virar venda — só existe o "de boca" até fechar.

**Decisão antes de colar o prompt:** proposta precisa gerar um PDF pra
mandar pro cliente, ou só um registro na tela mesmo (sem PDF)? Isso muda
bastante o tamanho da fase — se não tiver certeza, deixe o Claude perguntar.

```
Preciso construir "Propostas" em app/(app)/vendas/propostas/ (hoje é stub).

Antes de implementar, me pergunte: proposta precisa gerar PDF pra enviar ao
cliente, ou só fica registrada na tela (sem exportação)? Não presuma — se eu
já tiver respondido isso fora deste prompt, ignore esta pergunta e siga com o
que eu disse.

Nova migration (supabase/migrations/0014_propostas.sql): tabela propostas
(tenant_id, veiculo_id FK, cliente_id nullable FK ou cliente_nome_avulso —
mesmo padrão de vendas —, valor_proposto, condicoes — texto livre —, status:
"Em aberto" / "Aceita" / "Recusada" / "Expirada", validade — data —,
vendedor_id, criado_em). RLS current_tenant_id(). Uma proposta aceita deve
oferecer um botão "Converter em venda" que leva pro assistente de Nova venda
pré-preenchido (mesmo espírito do "Converter em venda" da Fase 19, reaproveite
se já existir).

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Criar uma proposta de teste pra um veículo do estoque.
- [ ] Marcar como aceita e converter em venda pré-preenche o assistente de
      Nova venda.

---

### Fase 21 — Renegociação de contrato de crediário

**Por que importa:** na tela de Inadimplência (Fase 5) o botão "Renegociar"
existe mas é só um toast herdado do protótipo — não faz nada de verdade.

```
Preciso implementar renegociação de contrato de crediário de verdade,
substituindo o botão "Renegociar" que hoje é só um toast em
InadimplenciaTable (app/(app)/financeiro/receber/).

Leia antes: lib/domain/parcelas.ts (gerarParcelas, já testado, reaproveite
pra montar o novo carnê — não reescreva a lógica de juros/arredondamento do
zero) e a RPC fechar_venda (busque nas migrations, é o padrão de operação
transacional já usado no projeto pra "várias tabelas mudam junto ou nenhuma
muda").

O que precisa acontecer ao renegociar um contrato:
1. As parcelas não pagas do contrato atual (contratos_crediario/parcelas)
   ficam marcadas com status "Renegociada" (esse valor já existe no enum
   StatusParcela) — não apaga, mantém pra auditoria.
2. Gera um novo carnê de parcelas (reaproveitando gerarParcelas) com os novos
   termos que o gestor definir na tela: nova quantidade de parcelas, nova taxa
   de juros, nova data do primeiro vencimento.
3. Tudo isso precisa ser uma operação atômica — crie uma nova RPC (ex.
   renegociar_contrato) numa migration nova
   (supabase/migrations/0015_renegociacao.sql), no mesmo estilo de
   fechar_venda, pra garantir que não fique estado inconsistente se algo
   falhar no meio.

Tela: um dialog acionado pelo botão "Renegociar" já existente, pedindo os
novos termos, chamando a RPC.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Rodar a migration nova no SQL Editor antes de testar.
- [ ] Um contrato de teste com parcela em atraso — renegociar gera um carnê
      novo e as parcelas antigas não pagas ficam marcadas como
      "Renegociada" (não desaparecem).
- [ ] O novo carnê aparece corretamente em Contas a receber.

---

## Tier 5 — cauda longa

Estas fases têm escopo mais aberto — em quase todas, o prompt pede pro Claude
te perguntar decisões de negócio antes de construir, porque não dá pra
definir isso num guia genérico. Leia a "decisão antes de colar" de cada uma
antes de começar.

### Fase 22 — Relatórios / PDF

**Decisão antes de colar:** quais 2-3 relatórios importam primeiro? "Todos os
relatórios" de uma vez é grande demais pra uma fase só. Pensei em: relatório
de estoque atual, relatório de vendas do mês, relatório financeiro (DRE
consolidado) — mas escolha você.

```
Preciso construir a tela de Relatórios em app/(app)/relatorios/ (hoje é
stub). Antes de implementar, me pergunte quais relatórios exportáveis eu
quero primeiro (não implemente "todos os relatórios possíveis" de uma vez) e
se preciso mesmo de exportação em PDF ou se uma versão pra imprimir do
navegador (Ctrl+P) já resolve pra começar — isso evita adicionar uma
biblioteca de geração de PDF sem necessidade real.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] O relatório escolhido mostra dados reais do tenant de teste, não dado
      fixo.
- [ ] Exportação/impressão funciona.

---

### Fase 23 — Configurações da loja

**Por que importa:** a tabela `tenant_config` já existe desde a Fase 0
(`multa_pct`, `mora_pct_dia`, `margem_minima_pct_default`,
`dias_alerta_estoque_parado`) e já é usada nos cálculos de juros/aging, mas
hoje só dá pra editar esses valores direto no banco — não tem tela.

```
Preciso construir "Configurações" em app/(app)/configuracoes/ (hoje é stub).

A tela tem duas partes:
1. Configurações do tenant (tabela tenant_config, uma linha por tenant): form
   editando multa_pct, mora_pct_dia, margem_minima_pct_default,
   dias_alerta_estoque_parado — com explicação curta do que cada campo
   controla (multa/mora afetam lib/domain/juros.ts, margem mínima afeta
   lib/domain/pricing.ts).
2. Gestão de lojas (tabela lojas, já existe desde a Fase 0): listar lojas do
   tenant, editar dados (nome, endereço, cidade, uf, telefone, ativo),
   cadastrar loja nova.

Tela só visível pra role gestor.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] Mudar `mora_pct_dia` na tela reflete no cálculo de juros de uma parcela
      atrasada em Contas a receber.
- [ ] Cadastrar uma loja nova aparece nos seletores de loja em outras telas
      (ex.: Entrada de veículo, Equipe).

---

### Fase 24 — Permissões avançadas

**Decisão antes de colar:** hoje há 3 papéis fixos (gestor/vendedor/
financeiro) com regras de acesso espalhadas pelo código
(`requireRole`, `lib/auth/session.ts`). "Permissões avançadas" normalmente
significa granularidade por ação (ex.: "vendedor X pode dar baixa em
parcela, vendedor Y não pode") — isso é uma mudança grande de arquitetura,
não uma tela isolada. Recomendo só atacar esta fase se um cliente real pedir
algo específico que os 3 papéis atuais não resolvem — não construa
"granularidade genérica" especulativamente.

```
Antes de qualquer código: me ajude a entender se preciso mesmo de permissões
granulares agora, ou se é um caso específico que um papel novo fixo (ex.:
"vendedor sênior") resolveria mais simples, no mesmo padrão dos 3 papéis
atuais (requireRole em lib/auth/session.ts). Só desenhe uma arquitetura de
permissões granulares (tabela de permissões por ação) se eu confirmar que é
isso mesmo que preciso, com um caso de uso concreto.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

---

### Fase 25 — Integrações reais

**Decisão antes de colar:** "integrações reais" engloba coisas bem diferentes
entre si (FIPE, consulta de placa/Renavam, WhatsApp Business API, portais de
anúncio como OLX/ICarros). Cada uma é essencialmente uma fase própria, com
custo/complexidade diferente. Escolha UMA pra começar.

```
Quero integrar [ESCOLHA UMA: consulta de tabela FIPE / consulta de
placa-Renavam / WhatsApp Business API / publicação em portal de anúncio] no
Revenda360. Antes de implementar, pesquise as opções de API disponíveis pro
Brasil pra isso (gratuita vs paga, limites), me apresente as opções com custo
aproximado, e só implemente depois que eu escolher qual usar — não assuma um
provedor específico.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

---

### Fase 26 — PWA

```
Quero transformar o Revenda360 num PWA instalável (ícone no celular, funciona
com tela cheia). Não preciso de funcionamento offline completo agora — só
instalável e com boa experiência mobile. Implemente o manifest e o básico de
PWA do Next.js, sem adicionar service worker complexo de cache offline a
menos que eu peça.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

#### Checklist de teste manual

- [ ] No celular, abrir o site mostra a opção "Adicionar à tela inicial" /
      "Instalar app".
- [ ] Depois de instalado, abre em tela cheia, sem barra de navegador.

---

### Fase 27 — Billing do SaaS

**Por que está por último:** enquanto a venda pra cada revenda cliente for
manual/negociada direto por você, isso não é urgente. Só vale a pena quando o
número de revendas clientes crescer o suficiente pra cobrança manual virar
trabalho de verdade.

```
Quero automatizar a cobrança das revendas clientes que usam o Revenda360
(hoje é cobrança manual, fora do sistema). Antes de implementar, me pergunte:
qual modelo de cobrança (mensalidade fixa por revenda? por usuário? por
veículo em estoque?) e qual gateway de pagamento (Stripe, mercado pago, outro)
— isso muda a arquitetura inteira, não presuma.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```

---

### Fase 28 — SMTP próprio no Supabase

**Por que está por último:** só é necessário se algum fluxo futuro (ex.:
convite de acesso por e-mail) voltar a depender de envio de e-mail — hoje o
projeto deliberadamente não depende disso (autocadastro público foi
removido, contas são provisionadas com senha temporária repassada por fora).

```
Preciso configurar um servidor SMTP próprio no projeto Supabase (hoje usa o
limite gratuito padrão do Supabase, baixo). Antes de implementar, confirme
comigo qual fluxo do produto vai passar a depender de e-mail de verdade — se
a resposta for "nenhum ainda", pare aqui, não há o que fazer nesta fase por
enquanto.

Regras fixas deste projeto (não pule nenhuma):
[cole aqui o bloco de regras do topo deste arquivo]
```
