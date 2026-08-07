-- Revenda 360 — Fase 16: Fornecedores
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0011.
--
-- veiculos.fornecedor (texto livre) NÃO é apagado nem migrado à força —
-- continua existindo e sendo exibido normalmente pra veículos já
-- cadastrados. fornecedor_id é uma coluna nova, opcional, só preenchida
-- quando o cadastro passa a linkar num fornecedor estruturado a partir de
-- agora.

create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  contato text,
  cnpj_cpf text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create index fornecedores_tenant_id_idx on public.fornecedores (tenant_id);

alter table public.fornecedores enable row level security;

create policy tenant_isolation on public.fornecedores
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

alter table public.veiculos
  add column fornecedor_id uuid references public.fornecedores (id) on delete set null;
