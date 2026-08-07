-- Revenda 360 — Fase 21: Renegociação de contrato de crediário
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0015.
--
-- Renegociar não edita o contrato existente: cria um contrato novo (com os
-- termos renegociados) ligado de volta ao anterior via
-- contrato_anterior_id, pra manter histórico completo. O contrato antigo
-- fica com status 'Renegociado' e suas parcelas não pagas viram
-- 'Renegociada' (valor já existe no enum status_parcela desde a Fase 4) —
-- nada é apagado.

alter table public.contratos_crediario
  add column contrato_anterior_id uuid references public.contratos_crediario (id) on delete set null;

-- =========================================================================
-- RPC — renegociar_contrato: mesma operação atômica de fechar_venda
-- (Fase 4): marca parcelas antigas + cria contrato novo + gera parcelas
-- novas numa única transação, ou nada muda se algo falhar no meio.
-- =========================================================================

create function public.renegociar_contrato(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.current_tenant_id();
  v_contrato_antigo_id uuid := (payload ->> 'contratoId')::uuid;
  v_contrato_antigo record;
  v_novo_contrato_id uuid;
  v_qtd_parcelas integer := (payload ->> 'qtdParcelas')::integer;
  v_taxa_juros_mensal numeric(5, 2) := coalesce((payload ->> 'taxaJurosMensal')::numeric, 0);
  v_data_primeiro_vencimento date := (payload ->> 'dataPrimeiroVencimento')::date;
  v_valor_total numeric(12, 2);
  v_parcela jsonb;
begin
  if v_tenant_id is null then
    raise exception 'Usuário sem tenant associado';
  end if;

  select * into v_contrato_antigo
  from public.contratos_crediario
  where id = v_contrato_antigo_id and tenant_id = v_tenant_id
  for update;

  if v_contrato_antigo.id is null then
    raise exception 'Contrato não encontrado';
  end if;

  update public.parcelas
  set status = 'Renegociada'
  where contrato_id = v_contrato_antigo_id and tenant_id = v_tenant_id and status <> 'Paga';

  v_valor_total := (
    select coalesce(sum((p ->> 'valor')::numeric), 0)
    from jsonb_array_elements(payload -> 'parcelas') p
  );
  if v_valor_total <= 0 then
    raise exception 'Carnê novo precisa ter ao menos uma parcela com valor';
  end if;

  insert into public.contratos_crediario (
    tenant_id, venda_id, cliente_id, veiculo_id, valor_total,
    taxa_juros_mensal, qtd_parcelas, data_primeiro_vencimento, status, contrato_anterior_id
  ) values (
    v_tenant_id, v_contrato_antigo.venda_id, v_contrato_antigo.cliente_id, v_contrato_antigo.veiculo_id,
    v_valor_total, v_taxa_juros_mensal, v_qtd_parcelas, v_data_primeiro_vencimento,
    'Ativo', v_contrato_antigo_id
  )
  returning id into v_novo_contrato_id;

  for v_parcela in select * from jsonb_array_elements(payload -> 'parcelas')
  loop
    insert into public.parcelas (tenant_id, contrato_id, numero, vencimento, valor)
    values (
      v_tenant_id, v_novo_contrato_id,
      (v_parcela ->> 'numero')::integer,
      (v_parcela ->> 'vencimento')::date,
      (v_parcela ->> 'valor')::numeric
    );
  end loop;

  update public.contratos_crediario set status = 'Renegociado' where id = v_contrato_antigo_id;

  return v_novo_contrato_id;
end;
$$;

grant execute on function public.renegociar_contrato(jsonb) to authenticated;
