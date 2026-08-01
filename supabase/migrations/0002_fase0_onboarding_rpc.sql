-- Revenda 360 — Fase 0: funções de onboarding e criação de membro de equipe.
-- Rode depois de 0001_fase0_fundacao.sql.
--
-- Por que "security definer": criar um tenant novo (ou um profile novo) exige
-- inserir linhas em tabelas cujas policies de RLS dependem de já existir um
-- profile para o usuário — o que ainda não é verdade no instante do
-- onboarding. Em vez de usar a service role key no código da aplicação para
-- contornar isso, essas funções concentram a exceção num único lugar
-- auditável no banco, cada uma com suas próprias checagens de autorização.

create function public.onboarding_criar_tenant(
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
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Este usuário já concluiu o onboarding';
  end if;

  insert into public.tenants (nome) values (p_nome_revenda)
  returning id into v_tenant_id;

  insert into public.tenant_config (tenant_id) values (v_tenant_id);

  insert into public.lojas (tenant_id, nome, cidade, uf)
  values (v_tenant_id, p_loja_nome, p_loja_cidade, p_loja_uf)
  returning id into v_loja_id;

  insert into public.profiles (id, tenant_id, loja_id, nome, role)
  values (auth.uid(), v_tenant_id, v_loja_id, p_nome_usuario, 'gestor');

  return v_tenant_id;
end;
$$;

-- Chamada depois que o Server Action já criou o usuário no Auth via Admin API
-- (isso exige a service role key e não pode ser feito por SQL puro — GoTrue
-- gerencia auth.users). Esta função só grava a linha em `profiles`, e apenas
-- se quem está chamando for gestor do próprio tenant.
create function public.criar_membro_equipe(
  p_user_id uuid,
  p_nome text,
  p_role public.user_role,
  p_loja_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if public.current_role() is distinct from 'gestor' then
    raise exception 'Apenas o gestor pode adicionar membros à equipe';
  end if;

  v_tenant_id := public.current_tenant_id();

  if exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Usuário já possui um perfil';
  end if;

  if p_loja_id is not null and not exists (
    select 1 from public.lojas where id = p_loja_id and tenant_id = v_tenant_id
  ) then
    raise exception 'Loja inválida para este tenant';
  end if;

  insert into public.profiles (id, tenant_id, loja_id, nome, role)
  values (p_user_id, v_tenant_id, p_loja_id, p_nome, p_role);
end;
$$;

revoke execute on function public.onboarding_criar_tenant(text, text, text, text, text) from public, anon;
grant execute on function public.onboarding_criar_tenant(text, text, text, text, text) to authenticated;

revoke execute on function public.criar_membro_equipe(uuid, text, public.user_role, uuid) from public, anon;
grant execute on function public.criar_membro_equipe(uuid, text, public.user_role, uuid) to authenticated;
