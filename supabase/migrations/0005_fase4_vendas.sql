-- Revenda 360 — Fase 4: Nova venda (vendas, pagamentos, crediário próprio)
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001, 0002, 0003 e 0004.

-- =========================================================================
-- Tipos
-- =========================================================================

create type public.status_venda as enum ('confirmada', 'cancelada');

create type public.tipo_pagamento as enum (
  'dinheiro', 'pix', 'cartao', 'transferencia', 'troca', 'financiamento_bancario', 'crediario'
);

create type public.status_parcela as enum (
  'A vencer', 'Paga', 'Atrasada', 'Parcial', 'Renegociada'
);

-- =========================================================================
-- Tabelas
-- =========================================================================

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id),
  cliente_id uuid references public.clientes (id),
  -- Nome digitado à mão quando a venda não usa um cliente cadastrado
  -- (cliente balcão ou nome informado sem passar pela tela de Clientes).
  cliente_nome_avulso text,
  vendedor_id uuid not null references public.profiles (id),
  data_venda date not null default current_date,
  valor_venda numeric(12, 2) not null,
  desconto numeric(12, 2) not null default 0,
  valor_final numeric(12, 2) not null,
  comissao_pct numeric(5, 2) not null default 0,
  comissao_valor numeric(12, 2) not null default 0,
  garantia text,
  observacoes text,
  status public.status_venda not null default 'confirmada',
  criado_em timestamptz not null default now()
);

create index vendas_tenant_id_idx on public.vendas (tenant_id);
create index vendas_veiculo_id_idx on public.vendas (veiculo_id);

create table public.venda_pagamentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  venda_id uuid not null references public.vendas (id) on delete cascade,
  tipo public.tipo_pagamento not null,
  valor numeric(12, 2) not null,
  detalhes jsonb not null default '{}'
);

create index venda_pagamentos_venda_id_idx on public.venda_pagamentos (venda_id);

create table public.contratos_crediario (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  venda_id uuid not null references public.vendas (id) on delete cascade,
  cliente_id uuid references public.clientes (id),
  veiculo_id uuid not null references public.veiculos (id),
  valor_total numeric(12, 2) not null,
  taxa_juros_mensal numeric(5, 2) not null default 0,
  qtd_parcelas integer not null,
  data_primeiro_vencimento date not null,
  status text not null default 'Ativo',
  criado_em timestamptz not null default now()
);

create index contratos_crediario_venda_id_idx on public.contratos_crediario (venda_id);
create index contratos_crediario_tenant_id_idx on public.contratos_crediario (tenant_id);

create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  contrato_id uuid not null references public.contratos_crediario (id) on delete cascade,
  numero integer not null,
  vencimento date not null,
  valor numeric(12, 2) not null,
  valor_pago numeric(12, 2) not null default 0,
  status public.status_parcela not null default 'A vencer',
  data_pagamento date,
  desconto_aplicado numeric(12, 2) not null default 0,
  juros_multa_aplicado numeric(12, 2) not null default 0
);

create index parcelas_contrato_id_idx on public.parcelas (contrato_id);
create index parcelas_tenant_status_idx on public.parcelas (tenant_id, status);

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.vendas enable row level security;
alter table public.venda_pagamentos enable row level security;
alter table public.contratos_crediario enable row level security;
alter table public.parcelas enable row level security;

create policy tenant_isolation on public.vendas
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy tenant_isolation on public.venda_pagamentos
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy tenant_isolation on public.contratos_crediario
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy tenant_isolation on public.parcelas
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================================
-- RPC — fechar_venda: opera venda + pagamentos + crediário + baixa de
-- estoque numa única transação, evitando o estado inconsistente que uma
-- sequência de inserts separados do Server Action poderia deixar pela
-- metade (ex.: venda criada mas veículo não marcado como vendido).
-- Roda com os privilégios de quem chama (não security definer): cada
-- insert já é coberto pelas policies de tenant_isolation acima.
-- =========================================================================

create function public.fechar_venda(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
  v_veiculo_id uuid := (payload ->> 'veiculoId')::uuid;
  v_cliente_id uuid := nullif(payload ->> 'clienteId', '')::uuid;
  v_vendedor_id uuid := (payload ->> 'vendedorId')::uuid;
  v_valor_venda numeric(12, 2) := (payload ->> 'valorVenda')::numeric;
  v_desconto numeric(12, 2) := coalesce((payload ->> 'desconto')::numeric, 0);
  v_valor_final numeric(12, 2);
  v_comissao_pct numeric(5, 2) := coalesce((payload ->> 'comissaoPct')::numeric, 0);
  v_comissao_valor numeric(12, 2);
  v_venda_id uuid;
  v_contrato_id uuid;
  v_pagamento jsonb;
  v_parcela jsonb;
  v_status_atual public.status_veiculo;
begin
  if v_tenant_id is null then
    raise exception 'Usuário sem tenant associado';
  end if;

  select status into v_status_atual
  from public.veiculos
  where id = v_veiculo_id and tenant_id = v_tenant_id
  for update;

  if v_status_atual is null then
    raise exception 'Veículo não encontrado';
  end if;
  if v_status_atual <> 'Disponível' then
    raise exception 'Veículo não está disponível para venda';
  end if;

  v_valor_final := v_valor_venda - v_desconto;
  v_comissao_valor := v_valor_final * (v_comissao_pct / 100);

  insert into public.vendas (
    tenant_id, veiculo_id, cliente_id, cliente_nome_avulso, vendedor_id,
    valor_venda, desconto, valor_final, comissao_pct, comissao_valor, garantia, observacoes
  ) values (
    v_tenant_id, v_veiculo_id, v_cliente_id, nullif(payload ->> 'clienteNomeAvulso', ''), v_vendedor_id,
    v_valor_venda, v_desconto, v_valor_final, v_comissao_pct, v_comissao_valor,
    nullif(payload ->> 'garantia', ''), nullif(payload ->> 'observacoes', '')
  )
  returning id into v_venda_id;

  for v_pagamento in select * from jsonb_array_elements(coalesce(payload -> 'pagamentos', '[]'::jsonb))
  loop
    insert into public.venda_pagamentos (tenant_id, venda_id, tipo, valor, detalhes)
    values (
      v_tenant_id, v_venda_id,
      (v_pagamento ->> 'tipo')::public.tipo_pagamento,
      (v_pagamento ->> 'valor')::numeric,
      coalesce(v_pagamento -> 'detalhes', '{}'::jsonb)
    );
  end loop;

  if jsonb_typeof(payload -> 'crediario') = 'object' then
    insert into public.contratos_crediario (
      tenant_id, venda_id, cliente_id, veiculo_id, valor_total,
      taxa_juros_mensal, qtd_parcelas, data_primeiro_vencimento
    ) values (
      v_tenant_id, v_venda_id, v_cliente_id, v_veiculo_id,
      (select sum((p ->> 'valor')::numeric) from jsonb_array_elements(payload -> 'crediario' -> 'parcelas') p),
      coalesce((payload -> 'crediario' ->> 'taxaJurosMensal')::numeric, 0),
      jsonb_array_length(payload -> 'crediario' -> 'parcelas'),
      (payload -> 'crediario' ->> 'dataPrimeiroVencimento')::date
    )
    returning id into v_contrato_id;

    for v_parcela in select * from jsonb_array_elements(payload -> 'crediario' -> 'parcelas')
    loop
      insert into public.parcelas (tenant_id, contrato_id, numero, vencimento, valor)
      values (
        v_tenant_id, v_contrato_id,
        (v_parcela ->> 'numero')::integer,
        (v_parcela ->> 'vencimento')::date,
        (v_parcela ->> 'valor')::numeric
      );
    end loop;
  end if;

  update public.veiculos set status = 'Vendido', atualizado_em = now()
  where id = v_veiculo_id and tenant_id = v_tenant_id;

  return v_venda_id;
end;
$$;

grant execute on function public.fechar_venda(jsonb) to authenticated;
