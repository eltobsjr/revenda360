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

/**
 * Provisiona um tenant completo (tenant + tenant_config + loja + profile
 * gestor) para um usuário já criado — o mesmo trabalho que o painel
 * administrativo (futuro) fará ao cadastrar uma revenda nova. Não existe mais
 * fluxo de autocadastro/onboarding no app: quem cria a revenda é o dono da
 * plataforma, e o cliente só faz login com a senha temporária recebida.
 * Usa o client com service role, que ignora RLS, espelhando exatamente o que
 * o painel administrativo vai fazer.
 */
export async function createTenantWithGestor({
  userId,
  nomeRevenda,
  nomeGestor,
  nomeLoja,
}: {
  userId: string;
  nomeRevenda: string;
  nomeGestor: string;
  nomeLoja: string;
}) {
  const admin = createTestAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ nome: nomeRevenda })
    .select("id")
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Falha ao criar tenant de teste: ${tenantError?.message}`);
  }

  const { error: configError } = await admin
    .from("tenant_config")
    .insert({ tenant_id: tenant.id });
  if (configError) {
    throw new Error(`Falha ao criar tenant_config de teste: ${configError.message}`);
  }

  const { data: loja, error: lojaError } = await admin
    .from("lojas")
    .insert({ tenant_id: tenant.id, nome: nomeLoja })
    .select("id")
    .single();
  if (lojaError || !loja) {
    throw new Error(`Falha ao criar loja de teste: ${lojaError?.message}`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    tenant_id: tenant.id,
    loja_id: loja.id,
    nome: nomeGestor,
    role: "gestor",
  });
  if (profileError) {
    throw new Error(`Falha ao criar profile gestor de teste: ${profileError.message}`);
  }

  return { tenantId: tenant.id, lojaId: loja.id };
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
