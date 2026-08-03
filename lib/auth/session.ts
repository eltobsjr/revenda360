import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type CurrentProfile = {
  id: string;
  tenantId: string;
  lojaId: string | null;
  nome: string;
  role: UserRole;
  email: string | null;
};

/**
 * Perfil do usuário autenticado (join implícito entre o JWT verificado e a
 * linha correspondente em `profiles`). Retorna null se não autenticado ou se
 * a conta ainda não foi provisionada (sem linha em `profiles`) — não deve
 * acontecer no fluxo normal, já que o profile é criado junto com o usuário
 * pelo painel administrativo.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, loja_id, nome, role")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  const email = claims?.claims.email;

  return {
    id: profile.id,
    tenantId: profile.tenant_id,
    lojaId: profile.loja_id,
    nome: profile.nome,
    role: profile.role,
    email: typeof email === "string" ? email : null,
  };
}

export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Não autenticado");
  }
  return profile;
}

export async function requireRole(roles: UserRole[]): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) {
    throw new Error("Sem permissão para executar esta ação");
  }
  return profile;
}

/**
 * O dono da plataforma não tem linha em `profiles` (não pertence a nenhum
 * tenant) — a identidade dele é a allowlist `platform_admins`, checada no
 * banco via a função `is_platform_admin()` (security definer).
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
}

export async function requirePlatformAdmin(): Promise<void> {
  if (!(await isPlatformAdmin())) {
    throw new Error("Sem permissão para executar esta ação");
  }
}
