-- Revenda 360 — Fase 9: Avaliação/Troca
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0007.
--
-- A Fase 4 (Nova venda) já registra o pagamento tipo 'troca' em
-- venda_pagamentos (valor + detalhes.descricao em texto livre), mas
-- deliberadamente não cria o veículo recebido no estoque (decisão de escopo
-- documentada em Revenda360SecondBrain/CHECKLIST.md). Esta coluna liga um
-- veículo, quando cadastrado a partir da tela de Avaliação/Troca, de volta ao
-- pagamento que o originou — usada tanto para preencher o formulário quanto
-- para a tela saber quais trocas ainda estão pendentes de virar veículo
-- (nenhum veiculos.origem_troca_pagamento_id apontando pra elas ainda).

alter table public.veiculos
  add column origem_troca_pagamento_id uuid references public.venda_pagamentos (id) on delete set null;

create unique index veiculos_origem_troca_pagamento_id_idx
  on public.veiculos (origem_troca_pagamento_id)
  where origem_troca_pagamento_id is not null;
