-- Painel administrativo do dono da plataforma (v1).
--
-- Identidade do platform admin: allowlist em `platform_admins`, não uma
-- linha em `profiles` (profiles.tenant_id é NOT NULL e toda a RLS
-- multi-tenant assume isso — o dono da plataforma não pertence a um
-- tenant). Só quem já tem acesso de service role (SQL Editor) gerencia
-- linhas dessa tabela; não há policy de insert/update/delete.

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

-- Permite ao platform admin listar os tenants existentes (tela /admin).
create policy tenants_select_platform_admin on public.tenants
  for select using (public.is_platform_admin());

-- Substitui onboarding_criar_tenant: recebe o usuário-alvo (já criado via
-- Admin API pelo platform admin) em vez de usar auth.uid(), e o gate de
-- autorização é is_platform_admin() em vez de "usuário sem profile ainda".
create function public.provisionar_revenda(
  p_user_id uuid,
  p_nome_revenda text,
  p_nome_usuario text,
  p_loja_nome text,
  p_loja_cidade text default null,
  p_loja_uf text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_loja_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas o administrador da plataforma pode provisionar revendas';
  end if;

  if exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Usuário já possui um perfil';
  end if;

  insert into public.tenants (nome) values (p_nome_revenda)
  returning id into v_tenant_id;

  insert into public.tenant_config (tenant_id) values (v_tenant_id);

  insert into public.lojas (tenant_id, nome, cidade, uf)
  values (v_tenant_id, p_loja_nome, p_loja_cidade, p_loja_uf)
  returning id into v_loja_id;

  insert into public.profiles (id, tenant_id, loja_id, nome, role)
  values (p_user_id, v_tenant_id, v_loja_id, p_nome_usuario, 'gestor');

  return v_tenant_id;
end;
$$;

revoke execute on function public.provisionar_revenda(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.provisionar_revenda(uuid, text, text, text, text, text) to authenticated;

-- onboarding_criar_tenant ficou sem uso desde a remoção do autocadastro
-- público (2026-08-01); provisionar_revenda o substitui de fato.
drop function if exists public.onboarding_criar_tenant(text, text, text, text, text);
