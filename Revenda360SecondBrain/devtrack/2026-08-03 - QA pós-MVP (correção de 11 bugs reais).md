# 2026-08-03 — QA pós-MVP (correção de 11 bugs reais)

Devtrack retroativo, gerado em 2026-08-05 ao auditar commits que não tinham log de sessão. Continuação da mesma tarde da Fase 6 — revisão de código do MVP completo, sem tela nova.

## O que foi feito

Dois commits seguidos (`1573e8a`, `82f9d1e`), 11 bugs reais corrigidos ao todo:

### `1573e8a` — normalização de meia-noite + campos financeiros opcionais

- `calcularDiasAtraso` (`lib/domain/juros.ts`) e `diasEstoque` (`lib/domain/pricing.ts`) comparavam `hoje` (hora real de execução) contra a meia-noite do vencimento/entrada sem truncar `hoje` para meia-noite também. Rodar a função à tarde inflava a contagem em 1 dia — parcela vencendo hoje virava "atrasada" antes da hora, veículo caía na faixa de aging seguinte cedo demais.
- Ficha do veículo (`financeiro-tab.tsx`, `resumo-tab.tsx`): preço mínimo, preço no financiamento e valor FIPE são opcionais no schema mas `formatBRL` quebrava com `null`. Agora mostram "—" quando ausentes.

### `82f9d1e` — 9 bugs encontrados em revisão de código pós-MVP

- **`gerarParcelas`**: arredondar cada parcela isoladamente perdia centavos (R$ 1.000 em 3x fechava R$ 999,99 em vez de R$ 1.000,00). Agora divide em centavos inteiros e joga o resto na última parcela.
- **Novo `lib/domain/datas.ts` (`dataIsoLocal`)**: `toISOString().slice(0,10)` converte para UTC antes de formatar — no fuso do Brasil (UTC-3), qualquer horário a partir das ~21h já caía no dia seguinte. Afetava a data de pagamento gravada na baixa de parcela e a data de entrada padrão do formulário de veículo.
- **`darBaixaParcela`**: duas baixas simultâneas da mesma parcela (dois cliques ou duas abas) podiam ambas reportar sucesso sem a segunda gravar nada. Agora confere via `.select("id")` quantas linhas o update realmente afetou.
- **`listInadimplencia`**: agrupava por nome do cliente — homônimos e todo "Cliente balcão" eram somados como se fossem uma pessoa só. Agora agrupa por `cliente_id` (ou `venda_id`, para balcão).
- **`InadimplenciaTable`**: key de lista usava o nome, com a mesma colisão. Agora usa a chave de agrupamento.
- **Dashboard**: valor de "Entrada em estoque" nas últimas movimentações é o custo de aquisição (dado sensível de gestor) e vazava pro vendedor — agora `null` fora do papel de gestor. Sort de "parcelas vencendo" usava um comparador inconsistente (só olhava `a`); agora atrasadas primeiro e, dentro do grupo, vencimento mais próximo primeiro.
- **`listVeiculosComFinanceiro`**: busca com vírgula/parênteses (ex.: "Gol, 2020") quebrava o filtro `.or()` do PostgREST e derrubava a tela de Estoque — mesmo tratamento já usado em `listClientes` aplicado aqui.
- **`salvarVeiculo`**: ao editar como não-gestor, os campos sensíveis (`valor_compra`, `preco_minimo`), ausentes do formulário por ocultação de role, eram regravados como `undefined` — apagava o custo e o preço mínimo já definidos pelo gestor. Agora esses campos são excluídos do payload de update fora do papel de gestor.
- **`MidiaTab`**: o filtro de fotos (`fotosExistentes.filter(...)`) recalculava um array novo a cada render e entrava nas deps de um `useEffect` que gera URL assinada — laço infinito de chamadas ao Storage. Agora memoizado com `useMemo`.

## Testes

46/46 vitest (38 anteriores + 8 novos: `juros.test.ts`, `pricing.test.ts`, `datas.test.ts`, `parcelas.test.ts`), 18/18 e2e, typecheck/lint/build limpos.

## Auditoria (2026-08-05)

Revisão posterior de todos os diffs confirma que as correções são consistentes com os problemas descritos — nenhum bug novo encontrado nestes dois commits.
