-- Revenda 360 — Fase 15: Consignados
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0010.
--
-- Decisões confirmadas com o Enzo antes de implementar:
-- 1. Comissão de consignação é valor fixo de repasse combinado com o
--    consignante (não percentual) — o que vender acima do repasse fica com
--    a revenda automaticamente, sem precisar armazenar uma "comissão"
--    separada.
-- 2. Quando o veículo consignado é vendido, o repasse vira automaticamente
--    uma Conta a pagar (Fase 11) — reaproveita a tela/fluxo que já existem
--    em vez de inventar um controle novo, e isso também já alimenta o
--    Fluxo de caixa (Fase 12) de graça assim que a conta for paga (nenhuma
--    mudança necessária lá). DRE por veículo (Fase 14) é atualizado nesta
--    mesma migration-adjacent code change pra descontar o repasse na
--    margem de veículos consignados.
--
-- Gap encontrado ao integrar: veículo consignado nasce com status
-- "Consignado" (não "Disponível"), e tanto a query de Nova venda quanto a
-- guarda de status dentro de fechar_venda só aceitavam "Disponível" — sem
-- ajustar os dois, um consignado nunca conseguiria ser vendido de verdade.
-- Corrigido aqui (guarda abaixo) e em lib/data/veiculos.ts/vendas/nova
-- (código da aplicação, fora desta migration).

-- =========================================================================
-- Tabela
-- =========================================================================

create table public.consignacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id) on delete cascade,
  consignante_nome text not null,
  consignante_contato text,
  valor_repasse numeric(12, 2) not null,
  -- Preenchido pelo fechar_venda quando o veículo é vendido (aponta pra
  -- conta a pagar criada automaticamente pro repasse) — null enquanto o
  -- consignado ainda está disponível.
  contas_pagar_id uuid references public.contas_pagar (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Um veículo só pode ter uma consignação ativa.
create unique index consignacoes_veiculo_id_idx on public.consignacoes (veiculo_id);
create index consignacoes_tenant_id_idx on public.consignacoes (tenant_id);

alter table public.consignacoes enable row level security;

create policy tenant_isolation on public.consignacoes
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- =========================================================================
-- fechar_venda: mesma RPC da Fase 4, com um passo a mais — se o veículo
-- vendido tem consignação pendente (contas_pagar_id ainda null), gera a
-- conta a pagar do repasse e liga a consignação a ela. `create or replace`
-- preserva a assinatura (payload jsonb -> uuid), então o app não muda.
-- =========================================================================

create or replace function public.fechar_venda(payload jsonb)
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
  v_consignacao_id uuid;
  v_valor_repasse numeric(12, 2);
  v_consignante_nome text;
  v_contas_pagar_id uuid;
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
  if v_status_atual not in ('Disponível', 'Consignado') then
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

  -- Fase 15: repasse de consignação vira conta a pagar automaticamente.
  select id, valor_repasse, consignante_nome
  into v_consignacao_id, v_valor_repasse, v_consignante_nome
  from public.consignacoes
  where veiculo_id = v_veiculo_id and tenant_id = v_tenant_id and contas_pagar_id is null;

  if v_consignacao_id is not null then
    insert into public.contas_pagar (tenant_id, descricao, categoria, fornecedor, valor, vencimento)
    values (
      v_tenant_id,
      'Repasse de consignação — veículo vendido',
      'Consignação',
      v_consignante_nome,
      v_valor_repasse,
      current_date
    )
    returning id into v_contas_pagar_id;

    update public.consignacoes set contas_pagar_id = v_contas_pagar_id where id = v_consignacao_id;
  end if;

  return v_venda_id;
end;
$$;
