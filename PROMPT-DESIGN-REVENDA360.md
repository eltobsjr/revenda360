# Prompt — Design do sistema Revenda 360

> Cole o conteúdo abaixo (tudo a partir de "Você é...") em uma conversa nova com o Claude.
> Se quiser gerar por partes, veja "Como usar em etapas" no final deste arquivo.

---

Você é um designer de produto sênior especializado em software de gestão (ERP/SaaS) para o mercado brasileiro, com forte domínio de design system, densidade de informação e usabilidade em telas operacionais.

Quero que você projete e construa um **protótipo navegável em HTML** do **Revenda 360**, um sistema de gestão para concessionárias e revendas de **carros e motos**.

## 1. Contexto do negócio

O Revenda 360 é usado por lojas de veículos seminovos de pequeno e médio porte (1 a 3 lojas, 2 a 15 funcionários). Hoje essas lojas controlam tudo em planilhas de Excel: cadastram a moto ou o carro, anotam o valor da venda, a quantidade de parcelas, o valor da parcela e a data de vencimento, e olham um "relatório geral" no fim do mês. O sistema precisa substituir a planilha sem assustar quem veio dela — ou seja, **as tarefas do dia a dia (lançar veículo, vender, receber parcela) têm que ser mais rápidas que na planilha**.

Perfis de usuário:

- **Dono/gestor** — quer ver dinheiro: quanto tem parado em estoque, quanto lucrou por veículo, quanto tem a receber, quem está devendo.
- **Vendedor** — cadastra veículo, atende lead, monta proposta, fecha venda. Usa muito o celular no pátio.
- **Financeiro/administrativo** — dá baixa em parcelas, cobra atrasados, lança despesas, emite carnê e contrato.

Tudo em **português do Brasil**, com moeda R$, datas dd/mm/aaaa e nomenclatura real do setor (placa, Renavam, chassi, FIPE, gravame, CRLV, carnê, repasse, consignado).

## 2. Formas de venda que o sistema precisa suportar

Todas podem ser **combinadas na mesma venda** (ex.: entrada em PIX + veículo na troca + saldo em 12x no carnê):

1. **Venda à vista** — dinheiro, PIX, cartão, transferência.
2. **Crediário próprio (carnê da loja)** — a loja financia. Entrada + N parcelas, taxa de juros ao mês, dia fixo de vencimento, juros e multa por atraso, baixa manual de parcela, renegociação, carnê impresso.
3. **Financiamento bancário** — proposta enviada para financeira, status (em análise / aprovada / recusada / liberada), valor financiado, valor de retorno/comissão da financeira, prazo de crédito na conta.
4. **Troca com volta** — cliente entrega um veículo na negociação: avaliação, valor de entrada dado ao veículo, e ele **entra automaticamente no estoque** como novo item.
5. **Consignação** — veículo de terceiro exposto na loja: dono, prazo do contrato, valor combinado com o dono, comissão da loja, repasse ao proprietário após a venda.

## 3. Entregável

Um **artifact HTML único, autocontido e clicável** (HTML + CSS + JS puro no mesmo arquivo, sem dependências externas, sem CDN). Deve:

- Ter navegação real: clicar no menu troca de tela, clicar num veículo abre a ficha dele, clicar em "Nova venda" abre o fluxo, abas funcionam, modais abrem e fecham.
- Vir populado com **dados fictícios brasileiros e realistas** — nomes de pessoas, marcas e modelos que realmente circulam no mercado de seminovos (Onix, HB20, Strada, Corolla, Compass, Kwid, Biz 125, CG 160 Fan, Factor 150, XRE 300, PCX 160), placas no padrão Mercosul, valores coerentes com a tabela FIPE, datas espalhadas nos últimos 6 meses. Nada de "Lorem ipsum" ou "Veículo 1".
- Ser **responsivo com peso igual em desktop e mobile**: em telas largas, layout denso com tabelas; abaixo de 768px o menu vira barra inferior/drawer, as tabelas viram cards empilhados e os formulários viram uma coluna. Desenhe pensando no vendedor cadastrando um carro pelo celular no pátio.
- Ter **tema claro (padrão) e tema escuro completo**, com um botão de alternância no cabeçalho que funcione de verdade, usando variáveis CSS.

## 4. Direção visual

Base clara e profissional, tipo ERP moderno — não um dashboard genérico de template.

- **Tokens**: defina em `:root` uma escala de cores (superfícies, bordas, texto primário/secundário/terciário), espaçamentos numa escala de 4px, raios e sombras. O tema escuro sobrescreve as mesmas variáveis.
- **Cor**: uma cor de marca sóbria como identidade e cores semânticas consistentes em todo o sistema — verde para pago/disponível, âmbar para a vencer/reservado/pendente, vermelho para atrasado/inadimplente, azul para informativo, cinza para vendido/inativo. Use a mesma semântica em badges, gráficos e KPIs.
- **Tipografia**: uma família só, com hierarquia clara. **Números tabulares** (`font-variant-numeric: tabular-nums`) em toda coluna de valor e data — é sistema de dinheiro, os dígitos precisam alinhar.
- **Densidade**: linhas de tabela compactas, mas com respiro. Prefira mostrar mais informação a esconder atrás de cliques — o usuário vem do Excel e quer ver tudo.
- **Nada de**: cards com sombra exagerada, gradientes roxos, emojis como ícones, ilustrações genéricas. Ícones devem ser SVG inline simples e consistentes.
- Deixe explícito, num bloco de comentário no topo do CSS, quais são os tokens e a lógica do design system.

## 5. Navegação

Sidebar recolhível no desktop / drawer no mobile, com busca global no topo (placa, modelo, nome do cliente ou CPF) e alternador de tema:

```
Dashboard
Estoque          → Veículos · Entrada de veículo · Avaliação/Troca · Consignados
Vendas           → Nova venda · Vendas realizadas · Propostas · Leads (CRM)
Financeiro       → Contas a receber (carnê) · Contas a pagar · Fluxo de caixa · Comissões · DRE por veículo
Cadastros        → Clientes · Fornecedores · Vendedores · Marcas/Modelos
Relatórios
Configurações
```

## 6. Telas a projetar

Projete as telas abaixo. As marcadas com ★ são as principais e devem estar completas e navegáveis; as demais podem ser mais enxutas, mas precisam existir e ser alcançáveis pelo menu.

### ★ 6.1 Dashboard

Visão do dono, respondendo "como está a loja hoje?". Inclua:

- **KPIs no topo**: veículos em estoque (quantidade + valor imobilizado em R$), vendas do mês (quantidade + faturamento + lucro líquido), ticket médio, margem média %, a receber no mês, inadimplência (% e R$ em atraso), giro médio de estoque em dias.
- **Parcelas vencendo** — vencidas / hoje / próximos 7 dias, com botão de ação rápida para dar baixa ou cobrar no WhatsApp. Esta é a informação mais acionável da tela.
- **Gráfico de vendas** dos últimos 12 meses (faturamento vs. lucro), em SVG puro.
- **Aging de estoque** — veículos por faixa de dias parados (0-30, 31-60, 61-90, +90), destacando os que passaram de 60 dias, que é onde a loja perde dinheiro.
- **Mix carros × motos** e **top modelos que mais vendem**.
- **Últimas movimentações** — entradas, vendas e recebimentos recentes.
- Filtro global de período no topo da tela.

### ★ 6.2 Estoque — lista de veículos

Tabela/grade com alternância entre **visão lista** (densa, para o gestor) e **visão galeria com foto** (para o vendedor). Colunas: foto, veículo (marca + modelo + versão), ano fab/mod, placa, KM, cor, valor de compra, valor de venda, margem, dias em estoque, status.

- Filtros: tipo (carro/moto), status, marca, faixa de preço, faixa de ano, faixa de KM, loja, origem, dias em estoque.
- Busca por placa, modelo ou chassi.
- **Status com cores fixas**: Disponível · Em preparação · Reservado · Vendido · Consignado · Repasse · Devolvido.
- Destaque visual para veículos parados há mais de 60 dias e para pendências de documentação.
- Ações em massa: publicar em portais, alterar preço, exportar.

### ★ 6.3 Entrada de veículo (formulário) — a tela mais importante do sistema

Formulário em **etapas ou abas**, que muda de campos conforme o tipo selecionado (Carro / Moto). Comece pedindo a placa com um botão "Buscar dados" que simula o preenchimento automático via consulta de placa/Renavam — e mostre visualmente que os campos foram preenchidos sozinhos.

**Campos comuns (carro e moto):**

| Bloco | Campos |
|---|---|
| Identificação | Tipo (carro/moto), Placa (padrão Mercosul), Renavam, Chassi (VIN), Nº do motor, UF e município de emplacamento, Marca, Modelo, Versão/complemento, Ano de fabricação, Ano do modelo, Cor, Combustível, KM atual, Procedência (nacional/importado), Categoria (particular/aluguel), Nº de proprietários anteriores |
| Documentação | CRLV em dia (sim/não), IPVA (pago/pendente + valor + ano), Licenciamento, Multas em aberto (valor), Gravame/alienação (financeira + valor de quitação), CRV/DUT em mãos, ATPV-e, Laudo cautelar (aprovado/com apontamento/não feito), Histórico de leilão ou sinistro, Chave reserva, Manual do proprietário |
| Aquisição | Data de entrada, Origem (compra de particular, troca, consignado, leilão, repasse de outra loja), Fornecedor/proprietário anterior, Valor de compra, Forma de pagamento da compra, Loja/pátio onde está |
| Custos (linhas dinâmicas, com total somando ao vivo) | Mecânica, Funilaria/pintura, Pneus, Documentação/transferência, Higienização/estética, Frete, Comissão de captação, Outros — cada um com descrição, fornecedor, valor e data |
| Precificação | Valor FIPE (com % em relação à FIPE calculado automaticamente), Preço de venda à vista, Preço no financiamento, **Preço mínimo de negociação** (só visível para o gestor), Custo total (compra + custos), Margem prevista em R$ e % — recalculada em tempo real conforme o usuário digita |
| Mídia e anúncio | Upload de fotos com reordenação e foto de capa, vídeo, descrição do anúncio, portais onde publicar (OLX, Webmotors, iCarros, Mercado Livre, site próprio) |
| Observações | Campo livre + checklist de pendências internas |

**Campos exclusivos de CARRO:**
Câmbio (manual / automático / CVT / automatizado / dupla embreagem), Motorização (1.0, 1.6, 2.0…), Potência (cv), Nº de portas, Carroceria (hatch, sedã, SUV, picape, minivan, station wagon), Tração (dianteira, traseira, 4x4/AWD), Blindado (sim/não + nível), Final de placa, **Opcionais** em grade de checkboxes: ar-condicionado, direção hidráulica/elétrica, vidros elétricos, travas elétricas, airbag, ABS, câmera de ré, sensor de estacionamento, multimídia/CarPlay, bancos de couro, teto solar, rodas de liga, faróis de LED, piloto automático, engate, kit GNV, controle de estabilidade.

**Campos exclusivos de MOTO:**
Cilindrada (cc), Tipo (street, naked, trail/big trail, scooter, custom, esportiva, cub/mobilete, off-road, triciclo), Nº de marchas, Partida (elétrica / pedal / ambas), Refrigeração (ar / líquida), Alimentação (injeção / carburador), Freio dianteiro e traseiro (disco / tambor), Sistema de freio (ABS / CBS / convencional), Tipo de roda (raio / liga leve), **Acessórios**: baú, protetor de motor/carenagem, alarme, bolha, capacete incluso, escapamento esportivo, manopla aquecida, rastreador.

Regras de UX obrigatórias no formulário: validação visível (placa, CPF, chassi com 17 caracteres), máscaras nos campos, campos obrigatórios marcados, salvamento de rascunho, resumo lateral fixo mostrando **custo total × preço × margem** enquanto o usuário preenche, e no mobile uma etapa por tela com barra de progresso.

### ★ 6.4 Ficha do veículo (detalhe)

Página do veículo com galeria de fotos, ficha técnica completa, e abas:

- **Resumo** — dados principais, status, dias em estoque, preço, margem.
- **Financeiro do veículo** — custo de aquisição, todos os custos lançados, preço de venda, **lucro real após a venda** (mini DRE do veículo).
- **Documentação** — checklist de pendências com semáforo.
- **Histórico/timeline** — entrada, custos lançados, alterações de preço, visitas/propostas, reserva, venda.
- **Anúncios** — onde está publicado e há quanto tempo.
- Ações: editar, alterar preço, reservar, vender, transferir de loja, marcar como repasse.

### ★ 6.5 Nova venda (fluxo em etapas)

O fluxo mais crítico depois do cadastro. Etapas:

1. **Veículo** — busca por placa/modelo, mostra preço e preço mínimo.
2. **Cliente** — busca por CPF ou cadastro rápido inline.
3. **Negociação** — valor de venda, desconto aplicado (com alerta se ficar abaixo do preço mínimo), veículo na troca (com avaliação e valor de abatimento).
4. **Pagamento** — composição da forma de pagamento em linhas somáveis: entrada (dinheiro/PIX/cartão) + veículo na troca + financiamento bancário + crediário próprio. Mostre em destaque **o quanto ainda falta compor** até o valor total, em vermelho enquanto não fecha e verde quando fecha.
5. **Crediário (se houver)** — entrada, quantidade de parcelas, taxa de juros a.m., data do primeiro vencimento, dia fixo de vencimento. **Gere e mostre a tabela de parcelas na hora**, com número, vencimento e valor, editável linha a linha.
6. **Documentos** — vendedor responsável, comissão, garantia (nota promissória, alienação), observações, e geração de contrato, recibo e carnê.
7. **Confirmação** — resumo completo, lucro da operação, e ação de fechar a venda (que baixa o veículo do estoque e cria as contas a receber).

### ★ 6.6 Financeiro — Contas a receber / Carnês

Coração do controle de crediário. Duas visões:

- **Por parcela** — tabela de todas as parcelas: cliente, veículo, nº da parcela (3/12), vencimento, valor, valor pago, dias de atraso, status (A vencer · Paga · Atrasada · Parcial · Renegociada). Filtros por período, status e cliente, com totalizadores no rodapé.
- **Por contrato/carnê** — cada venda parcelada com barra de progresso (quanto já foi pago do total), saldo devedor, próximo vencimento.

Inclua o **modal de baixa de parcela**: valor original, dias de atraso, juros e multa calculados automaticamente, desconto, valor recebido, forma e data do pagamento, recibo. E uma **régua de cobrança** com envio de lembrete por WhatsApp (mensagem pré-formatada) em D-3, no dia e a cada X dias de atraso.

Adicione também uma visão de **inadimplência**: ranking de clientes em atraso, valor total, faixas de atraso (1-15, 16-30, 31-60, +60 dias) e ações de renegociação.

### 6.7 Demais telas do Financeiro

- **Contas a pagar** — despesas fixas e variáveis, fornecedores, categorias, recorrência, vencimentos.
- **Fluxo de caixa** — entradas × saídas por dia/mês, saldo projetado, gráfico.
- **DRE por veículo** — tabela de lucratividade unidade a unidade: compra, custos, venda, comissão, lucro líquido, margem %, com totais do período. É o relatório que o dono mais vai olhar.
- **Comissões** — por vendedor, base de cálculo, pagas e a pagar.

### 6.8 Telas auxiliares

- **Clientes** — lista + ficha com dados pessoais (CPF/CNPJ, RG, CNH, data de nascimento, estado civil, profissão, renda), endereço com CEP, contatos (WhatsApp, e-mail), referências pessoais, veículos comprados, situação financeira com o histórico de pagamento e um indicador de bom/mau pagador.
- **Avaliação / Troca** — formulário de avaliação de veículo do cliente: dados do veículo, estado de conservação por item (lataria, pintura, pneus, motor, interior, documentação), valor FIPE, desconto por avaliação, proposta de compra sugerida, e conversão em entrada no estoque.
- **Leads / CRM** — kanban simples (Novo → Em atendimento → Proposta → Negociação → Fechado/Perdido) com origem do lead (OLX, Webmotors, Instagram, indicação, loja física), veículo de interesse e próxima ação agendada.
- **Consignados** — veículos de terceiros: proprietário, prazo do contrato, valor combinado, comissão, status do repasse.
- **Fornecedores**, **Vendedores/usuários com permissões**, **Configurações da loja** (dados, logo, lojas/filiais, taxas padrão de juros, categorias de despesa, modelos de contrato).
- **Relatórios** — central com os relatórios do sistema e filtros de período.
- **Documentos para impressão** — layout em A4 de: contrato de compra e venda, recibo de pagamento e **carnê de parcelas** (uma via por parcela, com valor, vencimento e dados da loja). Estes devem ter visual próprio, otimizado para papel.

## 7. Regras de negócio que o design precisa refletir

- Vender um veículo muda seu status para "Vendido" e o retira do estoque disponível; o valor imobilizado do dashboard cai na hora.
- Veículo na troca vira automaticamente um novo item de estoque com origem "Troca".
- Margem = preço de venda − (valor de compra + soma dos custos + comissão). Sempre mostre a margem quando houver preço na tela.
- Parcela vencida calcula multa e juros de mora conforme configuração da loja.
- "Preço mínimo" e "margem" são informações sensíveis: sinalize no design que são visíveis apenas para o perfil gestor.
- Veículo com gravame ativo ou documentação pendente exibe alerta em toda tela onde aparece.

## 8. Padrões de interface obrigatórios

- **Estados**: projete e mostre no protótipo os estados de lista vazia, carregando (skeleton) e erro — não só o estado "tudo cheio e bonito".
- **Feedback**: toasts de confirmação em ações, e confirmação explícita em ações destrutivas.
- **Tabelas**: cabeçalho fixo, ordenação por coluna, paginação, densidade ajustável, totalizadores no rodapé, e ação rápida na linha (hover no desktop, swipe/menu no mobile).
- **Formulários**: rótulo acima do campo, texto de ajuda quando necessário, erro embaixo do campo em vermelho, agrupamento em seções com título.
- **Acessibilidade**: contraste mínimo AA nos dois temas, foco de teclado visível, área de toque de no mínimo 44px no mobile, não usar cor como único indicador de status (sempre cor + texto ou ícone).
- **Atalhos** para o operador rápido: `/` foca a busca global, `N` abre nova venda.

## 9. Restrições técnicas

- Um único arquivo HTML, autocontido, sem bibliotecas externas, sem chamadas de rede, sem fontes remotas (use font stacks do sistema).
- Gráficos e ícones em SVG inline escritos à mão.
- Dados fictícios num objeto JavaScript no topo do script, fácil de identificar e editar.
- Sem backend: as interações manipulam o estado em memória e a interface reage a isso — mas ao dar baixa numa parcela ou fechar uma venda, os números da tela **precisam mudar de verdade**.
- Todo texto da interface em português do Brasil, com formatação de moeda e data brasileiras.

## 10. Critérios de aceite

O protótipo está pronto quando eu conseguir, sem sair dele:

1. Ver o dashboard e entender a saúde da loja em 10 segundos.
2. Cadastrar uma **moto** e ver que os campos são diferentes dos de um **carro**.
3. Abrir a ficha de um veículo e ver seu custo, sua margem e suas pendências.
4. Fazer uma venda parcelada, gerar as parcelas e ver o carnê.
5. Dar baixa em uma parcela atrasada, com juros calculados, e ver o total a receber diminuir.
6. Alternar entre tema claro e escuro em qualquer tela sem quebrar nada.
7. Reduzir a janela para largura de celular e continuar conseguindo fazer tudo isso.

## 11. Antes de construir

Comece me apresentando, em no máximo 15 linhas: a direção visual escolhida (paleta, tipografia, personalidade), a estrutura de navegação final e quais decisões você tomou onde o briefing deixou espaço. Depois construa o artifact completo.

Priorize profundidade sobre quantidade: prefiro 8 telas realmente bem resolvidas, com dados críveis e interações que funcionam, do que 20 telas vazias.

---

## Como usar em etapas (opcional)

Se o protótipo sair grande demais para uma resposta só, quebre assim, sempre na mesma conversa:

1. **Etapa 1** — cole as seções 1 a 5 e peça: *"Construa a base do design system, o shell de navegação (sidebar + topo + tema claro/escuro) e o Dashboard."*
2. **Etapa 2** — *"Agora adicione o Estoque, a Entrada de veículo (carro e moto) e a Ficha do veículo"* + seções 6.2 a 6.4.
3. **Etapa 3** — *"Agora o fluxo de Nova venda e o Financeiro/Contas a receber"* + seções 6.5 a 6.7.
4. **Etapa 4** — *"Agora as telas auxiliares e os documentos para impressão"* + seções 6.8 a 8.
5. **Etapa 5** — *"Revise contra os critérios de aceite da seção 10 e corrija o que não passar."*

## Fontes consultadas para os campos

- [Revenda Mais — sistema para lojas de veículos](https://revendamais.com.br/sistema-lojas-de-veiculos/) — módulos de estoque, avaliação, atendimento e CRM
- [Boom Sistemas](https://boomsistemas.com.br/) — fluxo de caixa, DRE, inadimplência
- [Auto Adm](https://autoadm.com.br/) — gestão de carros e motos, integrador de anúncios
- [Portal Gov.br — consulta de dados de veículo na base Renavam](https://www.gov.br/pt-br/servicos/consultar-dados-de-veiculo-na-base-renavam) — dados oficiais do veículo
- [Revenda Mais — Renavam na venda de usados](https://revendamais.com.br/blog/tudo-sobre-o-renavam-e-a-importancia-na-venda-de-carros-usados/) — documentação e restrições
