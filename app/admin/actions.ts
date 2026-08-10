"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ExcluirRevendaState = {
  error: string | null;
  sucesso: boolean;
};

/**
 * Apaga uma revenda por completo — tenant, lojas, veículos, vendas,
 * clientes, financeiro, tudo (cascata via `excluir_revenda`, ver migration
 * 0018), mais as contas de login de quem pertencia a ela. Irreversível: o
 * nome digitado no formulário precisa bater com o nome real da revenda.
 * Achado da auditoria de 2026-08-10: essa checagem comparava contra um
 * `nomeRevenda` que também vinha do próprio formData (client-supplied) —
 * uma requisição forjada direto contra a action satisfazia a confirmação
 * sem precisar saber o nome real. Agora busca o nome verdadeiro no banco
 * pelo `tenantId` antes de comparar.
 */
export async function excluirRevenda(
  _prevState: ExcluirRevendaState,
  formData: FormData,
): Promise<ExcluirRevendaState> {
  await requirePlatformAdmin();

  const tenantId = String(formData.get("tenantId") || "");
  const nomeConfirmacao = String(formData.get("nomeConfirmacao") || "").trim();

  if (!tenantId) {
    return { error: "Revenda inválida.", sucesso: false };
  }

  const supabase = await createClient();

  const { data: tenant } = await supabase.from("tenants").select("nome").eq("id", tenantId).maybeSingle();
  if (!tenant) {
    return { error: "Revenda não encontrada.", sucesso: false };
  }
  if (nomeConfirmacao !== tenant.nome) {
    return { error: "O nome digitado não confere com o nome da revenda.", sucesso: false };
  }

  // Precisa vir antes do delete: profiles some junto com o tenant na cascata.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("tenant_id", tenantId);

  const { error: rpcError } = await supabase.rpc("excluir_revenda", { p_tenant_id: tenantId });
  if (rpcError) {
    return { error: "Não foi possível excluir a revenda.", sucesso: false };
  }

  const admin = createAdminClient();
  for (const profile of profiles ?? []) {
    await admin.auth.admin.deleteUser(profile.id);
  }

  revalidatePath("/admin");
  return { error: null, sucesso: true };
}
