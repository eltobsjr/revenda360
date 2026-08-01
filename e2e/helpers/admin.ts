import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client com privilégios totais para uso exclusivo dos testes E2E: confirmar
 * e-mail sem depender de caixa de entrada real, e limpar dados de teste ao
 * final de cada teste (nunca usado pelo app em produção).
 */
export function createTestAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

export function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e.${prefix}.${stamp}@example.com`;
}

/**
 * Cria o usuário já confirmado direto via Admin API — ao contrário de
 * `supabase.auth.signUp()`, isto NÃO envia e-mail nenhum, então não consome a
 * cota de rate limit de envio de e-mail do projeto (baixíssima no plano
 * gratuito). Use isto para preparar o "usuário de teste" nos testes que não
 * são especificamente sobre o formulário de cadastro/confirmação em si.
 */
export async function createConfirmedUser(email: string, password: string) {
  const admin = createTestAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário de teste ${email}: ${error?.message}`);
  }
  return data.user.id;
}

export async function confirmEmail(email: string) {
  const admin = createTestAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`Usuário de teste não encontrado: ${email}`);
  await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
  return user.id;
}

/** Remove o tenant (cascata cobre profiles/lojas/tenant_config) e os auth users criados no teste. */
export async function cleanupTenantByName(nomeRevenda: string) {
  const admin = createTestAdminClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id")
    .eq("nome", nomeRevenda);

  for (const tenant of tenants ?? []) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .eq("tenant_id", tenant.id);

    await admin.from("tenants").delete().eq("id", tenant.id);

    for (const profile of profiles ?? []) {
      await admin.auth.admin.deleteUser(profile.id);
    }
  }
}

export async function deleteUserByEmail(email: string) {
  const admin = createTestAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
}
