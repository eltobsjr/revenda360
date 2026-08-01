-- Revenda 360 — Fase 0: fundação multi-tenant
-- Rode este arquivo inteiro no SQL Editor do Supabase (dashboard do projeto).
-- Ordem: extensões -> tipos -> tabelas -> funções auxiliares -> RLS.

create extension if not exists pgcrypto;

-- =========================================================================
-- Tipos
-- =========================================================================

create type public.user_role as enum ('gestor', 'vendedor', 'financeiro');

-- =========================================================================
-- Tabelas
-- =========================================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  plano text not null default 'trial',
  criado_em timestamptz not null default now()
);

create table public.tenant_config (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  multa_pct numeric(5, 2) not null default 2,
  mora_pct_dia numeric(6, 3) not null default 0.1,
  margem_minima_pct_default numeric(5, 2) not null default 8,
  dias_alerta_estoque_parado integer not null default 60
);

create table public.lojas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  nome text not null,
  endereco text,
  cidade text,
  uf char(2),
  telefone text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  loja_id uuid references public.lojas (id) on delete set null,
  nome text not null,
  role public.user_role not null default 'vendedor',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index profiles_tenant_id_idx on public.profiles (tenant_id);
create index lojas_tenant_id_idx on public.lojas (tenant_id);

-- =========================================================================
-- Funções auxiliares (security definer — usadas dentro das policies de RLS)
-- =========================================================================

create function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.tenants enable row level security;
alter table public.tenant_config enable row level security;
alter table public.lojas enable row level security;
alter table public.profiles enable row level security;

-- tenants: cada usuário só enxerga/edita o próprio tenant. Criação de tenant
-- não é feita por INSERT direto do cliente — só pela função de onboarding
-- (ver 0002_fase0_onboarding_rpc.sql), que roda como security definer.
create policy tenants_select on public.tenants
  for select using (id = public.current_tenant_id());

create policy tenants_update_gestor on public.tenants
  for update using (id = public.current_tenant_id() and public.current_role() = 'gestor');

-- tenant_config: mesma regra do tenant.
create policy tenant_config_select on public.tenant_config
  for select using (tenant_id = public.current_tenant_id());

create policy tenant_config_update_gestor on public.tenant_config
  for update using (tenant_id = public.current_tenant_id() and public.current_role() = 'gestor');

-- lojas: qualquer membro do tenant vê as lojas; só gestor cria/edita.
create policy lojas_select on public.lojas
  for select using (tenant_id = public.current_tenant_id());

create policy lojas_insert_gestor on public.lojas
  for insert with check (tenant_id = public.current_tenant_id() and public.current_role() = 'gestor');

create policy lojas_update_gestor on public.lojas
  for update using (tenant_id = public.current_tenant_id() and public.current_role() = 'gestor');

-- profiles: qualquer membro do tenant vê os colegas (tela de Equipe); cada um
-- só edita o próprio nome; criação de profile não é feita por INSERT direto
-- do cliente — só pelas funções de onboarding/equipe (security definer).
create policy profiles_select on public.profiles
  for select using (tenant_id = public.current_tenant_id());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());
