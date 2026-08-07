-- Revenda 360 — Fase 20: Propostas
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0014.
--
-- Decisão confirmada com o Enzo antes de implementar: proposta gera PDF de
-- verdade pra enviar ao cliente (não só registro na tela).

create type public.status_proposta as enum ('Em aberto', 'Aceita', 'Recusada', 'Expirada');

create table public.propostas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id),
  cliente_id uuid references public.clientes (id),
  cliente_nome_avulso text,
  valor_proposto numeric(12, 2) not null,
  condicoes text,
  status public.status_proposta not null default 'Em aberto',
  validade date,
  vendedor_id uuid not null references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index propostas_tenant_id_idx on public.propostas (tenant_id);
create index propostas_veiculo_id_idx on public.propostas (veiculo_id);

alter table public.propostas enable row level security;

create policy tenant_isolation on public.propostas
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
