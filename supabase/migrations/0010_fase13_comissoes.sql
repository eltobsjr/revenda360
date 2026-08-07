-- Revenda 360 — Fase 13: Comissões
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0009.
--
-- Decisão confirmada com o Enzo: campo simples em vendas (não tabela
-- separada) — cobre o caso de uso atual de marcar a comissão de uma venda
-- como paga de uma vez só, sem precisar de histórico de pagamento parcial.

alter table public.vendas
  add column comissao_paga boolean not null default false,
  add column comissao_data_pagamento date;
