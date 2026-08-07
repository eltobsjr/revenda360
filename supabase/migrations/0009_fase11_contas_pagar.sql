-- Revenda 360 — Fase 11: Contas a pagar
-- Rode este arquivo no SQL Editor do Supabase, depois de 0001 a 0008.
--
-- Espelha de perto contratos_crediario/parcelas (Fase 4/5): reaproveita os
-- enums public.status_parcela ("A vencer"/"Paga"/"Atrasada"/"Parcial"/
-- "Renegociada" — só os 3 primeiros fazem sentido aqui, mas não vale criar um
-- enum novo só pra isso) e public.tipo_pagamento pra forma_pagamento.
-- categoria e fornecedor ficam texto livre por enquanto (mesmo padrão hoje
-- usado em veiculos.fornecedor) — Fornecedores estruturado é a Fase 16.

create table public.contas_pagar (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  descricao text not null,
  categoria text,
  fornecedor text,
  valor numeric(12, 2) not null,
  vencimento date not null,
  status public.status_parcela not null default 'A vencer',
  valor_pago numeric(12, 2) not null default 0,
  data_pagamento date,
  forma_pagamento public.tipo_pagamento,
  criado_em timestamptz not null default now()
);

create index contas_pagar_tenant_id_idx on public.contas_pagar (tenant_id);
create index contas_pagar_tenant_status_idx on public.contas_pagar (tenant_id, status);

alter table public.contas_pagar enable row level security;

create policy tenant_isolation on public.contas_pagar
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
