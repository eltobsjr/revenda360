---
name: feedback-dados-dinamicos
description: Regra absoluta — nenhum dado na UI pode ser fixo/mock/fallback; tudo vem de consulta real ao banco
metadata:
  node_type: memory
  type: feedback
  originSessionId: 7948d36f-8b95-4bde-a2a6-a125f42999ed
  modified: 2026-08-03T16:26:01.781Z
---

**Regra absoluta: todo dado exibido na UI deve vir de uma consulta real ao Supabase — nunca hardcoded, mockado, ou com fallback para um valor fixo quando o cálculo real dá zero/vazio.** Isso inclui KPIs, listas, gráficos, contadores — qualquer número ou texto que pareça vir de dado de negócio.

**Why:** O usuário perguntou explicitamente "isso não é dado truncado?" ao ver um bug de arredondamento de datas no Dashboard (Fase 6), e reforçou "quero absolutamente tudo dinâmico, deve ser regra" mesmo depois de eu explicar que o bug era de cálculo, não de dado fake. A preocupação de fundo é legítima e mais ampla que o bug específico: o protótipo original (`Revenda360.dc.html`) tinha vários fallbacks desse tipo (ex.: `qtdVendasMes = vendidosMes.length || 8` — usa 8 vendas fictícias se o cálculo real der zero), e o usuário não quer NADA parecido com isso na versão real, nem por engano.

**How to apply:**
- Nunca escrever `valorCalculado || valorFixo` como fallback de exibição — se o cálculo real der 0/vazio, mostrar 0/vazio de verdade, não um número bonito.
- Nunca deixar array/objeto literal com aparência de dado de negócio (nome de cliente, veículo, valor em R$) fora de `lib/domain/*.test.ts` (dados de referência de teste) ou `e2e/*.spec.ts`/`e2e/helpers/admin.ts` (seed de teste) — em `app/`, `components/`, `lib/data/*` isso é proibido.
- Telas legitimamente não construídas devem usar `StubScreen` (aviso explícito "ainda será construída"), nunca simular dado com um placeholder que pareça real.
- Ao encontrar um bug de cálculo (não de dado fake) que produz número errado, deixar claro pro usuário que é isso — cálculo incorreto sobre dado real — e não "dado truncado", mas tratar com a mesma prioridade de correção.
- Rodar QA end-to-end (seed real via service role + navegação de verdade no navegador) sempre que o usuário pedir para "testar tudo" — ver [[project_arquitetura_supabase]] para o padrão de seed via Admin API.
