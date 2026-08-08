-- Revenda 360 — Correções de segurança da auditoria completa de 2026-08-08.
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0016.
--
-- Achado CRÍTICO: a policy profiles_update_self (0001) só restringe QUAL
-- linha pode ser editada (id = auth.uid()), não QUAIS colunas. Sem WITH
-- CHECK explícito, o Postgres reaproveita o USING como WITH CHECK — e como
-- id não muda no update, QUALQUER mudança passava, inclusive role e
-- tenant_id. Isso permitia que qualquer usuário autenticado se promovesse a
-- gestor ou sequestrasse outro tenant chamando
-- `supabase.from('profiles').update({role: 'gestor', tenant_id: '...'})`
-- direto do client do navegador, sem passar por nenhuma checagem do
-- Next.js (requireProfile/requireRole).

-- Bypassa a checagem só pra service_role (chave secreta, nunca exposta ao
-- browser) — usada hoje por scripts administrativos/testes, e reserva
-- espaço pra uma futura função "alterar role de membro" rodar como
-- security definer sem precisar desabilitar o trigger. Client anon/
-- authenticated (é isso que o browser usa) nunca cai nesse bypass.
create function public.profiles_prevent_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.tenant_id is distinct from old.tenant_id
  then
    raise exception 'Não é permitido alterar id, role ou tenant_id de um profile existente.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.profiles_prevent_privilege_escalation();

-- Achado ALTO: profiles.ativo nunca era verificado em current_tenant_id()/
-- current_role() — "desativar" um membro da equipe não revogava acesso
-- nenhum via RLS, só a sessão expirando eventualmente.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() and ativo = true
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and ativo = true
$$;

-- Achado ALTO: fechar_venda e renegociar_contrato concediam EXECUTE só
-- pra "authenticated", mas sem revogar de public/anon antes — diferente do
-- padrão já usado em onboarding_criar_tenant/criar_membro_equipe/
-- provisionar_revenda. Hoje mitigado porque ambas abortam com tenant nulo,
-- mas deixa a correção frágil a mudanças futuras no corpo da função.

revoke execute on function public.fechar_venda(jsonb) from public, anon;
grant execute on function public.fechar_venda(jsonb) to authenticated;

revoke execute on function public.renegociar_contrato(jsonb) from public, anon;
grant execute on function public.renegociar_contrato(jsonb) to authenticated;

-- Achado CRÍTICO (bug funcional, não de segurança): renegociar_contrato não
-- checava se o contrato ainda estava 'Ativo' antes de renegociar de novo —
-- renegociar duas vezes o mesmo contrato (ex.: duplo clique, ou reabrir a
-- tela antiga) criava um terceiro carnê a partir de um contrato que já
-- tinha sido substituído, e as parcelas 'Renegociada' continuavam contando
-- como "em aberto" no Dashboard e com botão de baixa ativo em Contas a
-- receber (corrigido também em lib/data/contas-receber.ts e dashboard.ts).

create or replace function public.renegociar_contrato(payload jsonb)
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
  if v_contrato_antigo.status <> 'Ativo' then
    raise exception 'Este contrato já foi renegociado — não é possível renegociar de novo.';
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

-- Achado MÉDIO: fechar_venda validava que o veiculo_id pertence ao tenant
-- do chamador antes de usar, mas cliente_id/vendedor_id vinham do payload
-- sem essa checagem — servia de oráculo de existência pra enumerar
-- UUIDs de clientes/vendedores de outros tenants por tentativa e erro.

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

  if v_cliente_id is not null and not exists (
    select 1 from public.clientes where id = v_cliente_id and tenant_id = v_tenant_id
  ) then
    raise exception 'Cliente não encontrado';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_vendedor_id and tenant_id = v_tenant_id
  ) then
    raise exception 'Vendedor não encontrado';
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
