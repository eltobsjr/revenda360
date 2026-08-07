-- Revenda 360 — Fase 19: Leads (CRM kanban)
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0013.
--
-- Etapas do funil propostas pelo guia de construção — não travadas sem
-- confirmar, mas a decisão em aberto era mais sobre biblioteca de
-- drag-and-drop (confirmada com o Enzo: @dnd-kit) do que sobre o enum em si.

create type public.etapa_lead as enum (
  'Novo', 'Em contato', 'Visita agendada', 'Proposta enviada', 'Ganho', 'Perdido'
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  contato text,
  origem text,
  veiculo_interesse_id uuid references public.veiculos (id) on delete set null,
  vendedor_id uuid references public.profiles (id) on delete set null,
  etapa public.etapa_lead not null default 'Novo',
  observacoes text,
  criado_em timestamptz not null default now()
);

create index leads_tenant_id_idx on public.leads (tenant_id);
create index leads_tenant_etapa_idx on public.leads (tenant_id, etapa);

alter table public.leads enable row level security;

create policy tenant_isolation on public.leads
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
