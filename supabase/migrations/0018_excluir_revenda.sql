-- Exclusão de revenda pelo painel administrativo. Mesmo padrão de
-- provisionar_revenda (0007_admin_panel.sql): security definer + checagem
-- de is_platform_admin() dentro da própria função — defesa em profundidade
-- além do gate do Next.js em requirePlatformAdmin(), já que `tenants` não
-- tem policy de delete nenhuma (só select pra platform admin).
--
-- Só apaga o lado public: `tenants` e tudo que referencia tenant_id com
-- ON DELETE CASCADE (tenant_config, lojas, profiles, veiculos, vendas,
-- clientes, contas_pagar, parcelas, contratos_crediario, leads, propostas,
-- etc.) — mesmo efeito que `cleanupTenantByName` já usa há tempo pra
-- limpeza de tenant de teste. As contas de login (auth.users) dos perfis
-- do tenant são apagadas à parte pela Server Action via Admin API — não dá
-- pra apagar auth.users de dentro de uma função SQL comum.
create function public.excluir_revenda(p_tenant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas o administrador da plataforma pode excluir revendas';
  end if;

  delete from public.tenants where id = p_tenant_id;
end;
$$;

revoke execute on function public.excluir_revenda(uuid) from public, anon;
grant execute on function public.excluir_revenda(uuid) to authenticated;
