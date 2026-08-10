-- Auditoria de 2026-08-10 (perfis de usuário + agentes de qualidade).
--
-- Achado BAIXA/MÉDIA (latente, não explorável hoje): as policies de UPDATE
-- de `tenants`, `tenant_config` e `lojas` (0001_fase0_fundacao.sql) nunca
-- tiveram `WITH CHECK` explícito — mesma classe estrutural do bug crítico
-- de auto-escalação em `profiles` que a auditoria de 2026-08-08 corrigiu
-- (migration 0017), só que aqui o Postgres reaproveitando o `USING` ainda
-- restringe corretamente qual linha pode ser alterada (não dá pra mudar de
-- tenant), então não há exploração possível hoje. O risco é de coluna, não
-- de linha: sem `WITH CHECK`, nada impede um `gestor` de alterar QUALQUER
-- coluna dessas tabelas via update direto pelo client — inclusive
-- `tenants.plano`, que hoje só é exibido (sem nenhum gate de feature/
-- paywall no código), mas que se algum dia vier a controlar acesso a algo,
-- vira auto-escalação de plano sem precisar de nenhuma mudança de código.
--
-- Fecha o gap adicionando `WITH CHECK` idêntico ao `USING` já existente —
-- mesmo padrão de `lojas_insert_gestor`, a única policy do arquivo
-- original que já nasceu com essa defesa.

alter policy tenants_update_gestor on public.tenants
  with check (id = public.current_tenant_id() and public.current_role() = 'gestor');

alter policy tenant_config_update_gestor on public.tenant_config
  with check (tenant_id = public.current_tenant_id() and public.current_role() = 'gestor');

alter policy lojas_update_gestor on public.lojas
  with check (tenant_id = public.current_tenant_id() and public.current_role() = 'gestor');
