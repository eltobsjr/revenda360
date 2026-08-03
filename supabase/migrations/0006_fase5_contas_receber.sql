-- Revenda 360 — Fase 5: Contas a receber (baixa de parcela)
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0005.

-- Nenhuma tabela nova: `contratos_crediario`/`parcelas` já existem desde a
-- Fase 4. Só falta registrar a forma de pagamento usada na baixa da
-- parcela (reaproveita o enum `tipo_pagamento` criado na Fase 4 — as opções
-- reais oferecidas na tela são um subconjunto: dinheiro/pix/cartão/transferência).
alter table public.parcelas
  add column forma_pagamento public.tipo_pagamento;
