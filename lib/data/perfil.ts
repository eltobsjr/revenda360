import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

/**
 * Tudo aqui vem de coluna que já existe no banco — `profiles` não tem
 * avatar/telefone/CPF/bio, então o perfil não mostra o que não existe.
 * `email`/`criadoEm`/`ultimoLogin` vêm de `auth.users` via
 * `supabase.auth.getUser()` (dado do próprio usuário autenticado, não
 * precisa de client admin).
 */
export type PerfilBase = {
  id: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  email: string | null;
  criadoEm: string | null;
  ultimoLogin: string | null;
  loja: { id: string; nome: string } | null;
  tenant: { id: string; nome: string } | null;
};

export async function getPerfilBase(userId: string): Promise<PerfilBase | null> {
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: userData }] = await Promise.all([
    supabase.from("profiles").select("id, nome, role, ativo, loja_id, tenant_id").eq("id", userId).single(),
    supabase.auth.getUser(),
  ]);
  if (profileError || !profile) throw new Error(`Falha ao buscar perfil: ${profileError?.message}`);

  const [lojaRes, tenantRes] = await Promise.all([
    profile.loja_id
      ? supabase.from("lojas").select("id, nome").eq("id", profile.loja_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("tenants").select("id, nome").eq("id", profile.tenant_id).maybeSingle(),
  ]);

  return {
    id: profile.id,
    nome: profile.nome,
    role: profile.role,
    ativo: profile.ativo,
    email: userData.user?.email ?? null,
    criadoEm: userData.user?.created_at ?? null,
    ultimoLogin: userData.user?.last_sign_in_at ?? null,
    loja: lojaRes.data ? { id: lojaRes.data.id, nome: lojaRes.data.nome } : null,
    tenant: tenantRes.data ? { id: tenantRes.data.id, nome: tenantRes.data.nome } : null,
  };
}

export type EstatisticasVendedor = {
  vendasConfirmadas: number;
  faturamentoTotal: number;
  propostasEmAberto: number;
  leadsEmCarteira: number;
};

/**
 * Só contagens e valor de venda (já visível ao vendedor em "Vendas
 * realizadas") — nunca comissão, que é dado gestor-only (CLAUDE.md, regra
 * suprema). Consulta nova e restrita a `vendedor_id = próprio usuário`, não
 * reaproveita `lib/data/comissoes.ts` (gestor-only por design).
 */
export async function getEstatisticasVendedor(vendedorId: string): Promise<EstatisticasVendedor> {
  const supabase = await createClient();

  const [vendasRes, propostasRes, leadsRes] = await Promise.all([
    supabase.from("vendas").select("valor_final").eq("vendedor_id", vendedorId).eq("status", "confirmada"),
    supabase
      .from("propostas")
      .select("id", { count: "exact", head: true })
      .eq("vendedor_id", vendedorId)
      .eq("status", "Em aberto"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("vendedor_id", vendedorId)
      .not("etapa", "in", "(Ganho,Perdido)"),
  ]);

  if (vendasRes.error) throw new Error(`Falha ao buscar vendas: ${vendasRes.error.message}`);
  if (propostasRes.error) throw new Error(`Falha ao buscar propostas: ${propostasRes.error.message}`);
  if (leadsRes.error) throw new Error(`Falha ao buscar leads: ${leadsRes.error.message}`);

  const vendas = vendasRes.data ?? [];
  return {
    vendasConfirmadas: vendas.length,
    faturamentoTotal: vendas.reduce((soma, v) => soma + v.valor_final, 0),
    propostasEmAberto: propostasRes.count ?? 0,
    leadsEmCarteira: leadsRes.count ?? 0,
  };
}

export type EstatisticasGestor = {
  qtdLojas: number;
  qtdMembrosAtivos: number;
};

/** Contagens simples do tenant — nada financeiro, só estrutura da equipe/lojas. */
export async function getEstatisticasGestor(): Promise<EstatisticasGestor> {
  const supabase = await createClient();

  const [lojasRes, membrosRes] = await Promise.all([
    supabase.from("lojas").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("ativo", true),
  ]);
  if (lojasRes.error) throw new Error(`Falha ao contar lojas: ${lojasRes.error.message}`);
  if (membrosRes.error) throw new Error(`Falha ao contar equipe: ${membrosRes.error.message}`);

  return {
    qtdLojas: lojasRes.count ?? 0,
    qtdMembrosAtivos: membrosRes.count ?? 0,
  };
}
