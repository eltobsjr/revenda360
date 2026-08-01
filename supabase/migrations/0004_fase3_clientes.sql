-- Revenda 360 — Fase 3: Clientes (básico)
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001, 0002 e 0003.

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  cpf text,
  whatsapp text,
  email text,
  cidade text,
  criado_em timestamptz not null default now()
);

create index clientes_tenant_id_idx on public.clientes (tenant_id);
create unique index clientes_tenant_cpf_idx
  on public.clientes (tenant_id, cpf)
  where cpf is not null;

alter table public.clientes enable row level security;

create policy tenant_isolation on public.clientes
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
