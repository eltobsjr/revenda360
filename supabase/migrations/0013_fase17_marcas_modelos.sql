-- Revenda 360 — Fase 17: Marcas/Modelos
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0012.
--
-- Catálogo estruturado pra padronizar preenchimento (evitar "Volkswagen Gol"
-- e "VW Gol" como valores diferentes). Mesma lógica de compatibilidade da
-- Fase 16: veiculos.marca/modelo (texto livre) NÃO são tocados nem migrados
-- à força — continuam existindo como estão. O catálogo só alimenta o select
-- da Entrada de veículo, que escreve o texto escolhido nesses mesmos campos.
-- "Desativar" é soft-delete (campo ativo) pra não quebrar histórico.

create table public.marcas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index marcas_tenant_id_idx on public.marcas (tenant_id);

alter table public.marcas enable row level security;

create policy tenant_isolation on public.marcas
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create table public.modelos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  marca_id uuid not null references public.marcas (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index modelos_marca_id_idx on public.modelos (marca_id);
create index modelos_tenant_id_idx on public.modelos (tenant_id);

alter table public.modelos enable row level security;

create policy tenant_isolation on public.modelos
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
