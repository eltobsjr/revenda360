-- Revenda 360 — Fase 1: Estoque (veículos, custos, fotos)
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 e 0002.

-- =========================================================================
-- Tipos
-- =========================================================================

create type public.tipo_veiculo as enum ('carro', 'moto');

create type public.status_veiculo as enum (
  'Disponível', 'Em preparação', 'Reservado', 'Vendido', 'Consignado', 'Repasse', 'Devolvido'
);

-- =========================================================================
-- Tabelas
-- =========================================================================

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  loja_id uuid references public.lojas (id) on delete set null,
  tipo public.tipo_veiculo not null,

  -- Identificação
  placa text not null,
  renavam text,
  chassi text,
  numero_motor text,
  uf_emplacamento char(2),
  municipio_emplacamento text,
  marca text not null,
  modelo text not null,
  versao text,
  ano_fab integer,
  ano_mod integer,
  cor text,
  combustivel text,
  km integer not null default 0,
  procedencia text not null default 'nacional' check (procedencia in ('nacional', 'importado')),
  categoria text not null default 'particular' check (categoria in ('particular', 'aluguel')),
  proprietarios_anteriores integer not null default 0,

  -- Documentação
  crlv_em_dia boolean not null default true,
  ipva_status text not null default 'Pago' check (ipva_status in ('Pago', 'Pendente')),
  ipva_valor numeric(12, 2),
  ipva_ano integer,
  licenciamento_em_dia boolean not null default true,
  multas_valor numeric(12, 2) not null default 0,
  gravame boolean not null default false,
  gravame_financeira text,
  gravame_valor_quitacao numeric(12, 2),
  crv_em_maos boolean not null default true,
  atpve boolean not null default false,
  laudo_cautelar text not null default 'Não feito'
    check (laudo_cautelar in ('Aprovado', 'Com apontamento', 'Não feito')),
  historico_leilao_sinistro boolean not null default false,
  chave_reserva boolean not null default true,
  manual_proprietario boolean not null default true,

  -- Aquisição
  data_entrada date not null default current_date,
  origem text not null default 'Compra de particular'
    check (origem in ('Compra de particular', 'Troca', 'Leilão', 'Repasse de outra loja', 'Consignado')),
  fornecedor text,
  valor_compra numeric(12, 2) not null default 0,
  forma_pag_compra text,

  -- Precificação
  valor_fipe numeric(12, 2),
  preco_venda numeric(12, 2) not null default 0,
  preco_financiamento numeric(12, 2),
  preco_minimo numeric(12, 2),

  -- Mídia e anúncio
  descricao_anuncio text,
  portais_publicar text[] not null default '{}',

  -- Especificações exclusivas de carro OU moto + opcionais/acessórios
  especificacoes jsonb not null default '{}',

  status public.status_veiculo not null default 'Disponível',
  observacoes text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index veiculos_tenant_id_idx on public.veiculos (tenant_id);
create index veiculos_tenant_status_idx on public.veiculos (tenant_id, status);

create table public.custos_veiculo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id) on delete cascade,
  categoria text not null check (categoria in (
    'Mecânica', 'Funilaria/pintura', 'Pneus', 'Documentação/transferência',
    'Higienização/estética', 'Frete', 'Comissão de captação', 'Outros'
  )),
  descricao text,
  fornecedor text,
  valor numeric(12, 2) not null,
  data date not null default current_date,
  criado_em timestamptz not null default now()
);

create index custos_veiculo_veiculo_id_idx on public.custos_veiculo (veiculo_id);
create index custos_veiculo_tenant_id_idx on public.custos_veiculo (tenant_id);

create table public.veiculo_fotos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id) on delete cascade,
  storage_path text not null,
  ordem integer not null default 0,
  capa boolean not null default false,
  criado_em timestamptz not null default now()
);

create index veiculo_fotos_veiculo_id_idx on public.veiculo_fotos (veiculo_id);

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.veiculos enable row level security;
alter table public.custos_veiculo enable row level security;
alter table public.veiculo_fotos enable row level security;

create policy tenant_isolation on public.veiculos
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy tenant_isolation on public.custos_veiculo
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy tenant_isolation on public.veiculo_fotos
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================================
-- Storage — bucket privado para fotos de veículo
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('veiculo-fotos', 'veiculo-fotos', false)
on conflict (id) do nothing;

-- Path esperado: {tenant_id}/{veiculo_id}/{arquivo}. RLS do Storage restringe
-- por tenant_id no primeiro segmento do path.
create policy tenant_isolation_storage on storage.objects
  for all
  using (
    bucket_id = 'veiculo-fotos'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  )
  with check (
    bucket_id = 'veiculo-fotos'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
