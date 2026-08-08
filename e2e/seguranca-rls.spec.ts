import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  createTestAdminClient,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

/**
 * Client igual ao que o browser usa (`lib/supabase/client.ts`), com a anon
 * key — pra reproduzir exatamente o que um usuário mal-intencionado
 * conseguiria fazer direto do console do navegador, sem passar por nenhum
 * Server Action do Next.js.
 */
function createBrowserLikeClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

test.describe("Segurança — RLS de profiles (achado crítico da auditoria de 2026-08-08)", () => {
  let vendedorEmail: string;
  let vendedorId: string;
  let nomeRevenda: string;
  let tenantId: string;
  let outroTenantId: string;

  test.beforeEach(async () => {
    vendedorEmail = uniqueEmail("rls-vendedor");
    nomeRevenda = `E2E RLS ${Date.now()}`;

    vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    const { tenantId: tId } = await createTenantWithGestor({
      userId: vendedorId,
      nomeRevenda,
      nomeGestor: "Vendedor RLS E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;

    // Rebaixa o profile recém-criado pra "vendedor" (createTenantWithGestor
    // sempre cria como gestor) — o ataque relevante é um vendedor tentando
    // se auto-promover, não um gestor mexendo no próprio profile.
    const admin = createTestAdminClient();
    await admin.from("profiles").update({ role: "vendedor" }).eq("id", vendedorId);

    // Um segundo tenant, só pra tentar "sequestrar" via troca de tenant_id.
    const { data: outroTenant } = await admin
      .from("tenants")
      .insert({ nome: `${nomeRevenda} (alvo)` })
      .select("id")
      .single();
    outroTenantId = outroTenant!.id;
  });

  test.afterEach(async () => {
    const admin = createTestAdminClient();
    await admin.from("tenants").delete().eq("id", outroTenantId);
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("vendedor não consegue se auto-promover a gestor via UPDATE direto em profiles", async () => {
    const browserClient = createBrowserLikeClient();
    const { error: loginError } = await browserClient.auth.signInWithPassword({
      email: vendedorEmail,
      password: SENHA,
    });
    expect(loginError).toBeNull();

    // Ataque: exatamente o que o achado crítico da auditoria descreveu —
    // chamar update() direto do client anon/browser, sem passar por
    // requireProfile()/requireRole() do Next.js.
    await browserClient.from("profiles").update({ role: "gestor" }).eq("id", vendedorId);

    const admin = createTestAdminClient();
    const { data: profileDepois } = await admin
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", vendedorId)
      .single();

    expect(profileDepois?.role).toBe("vendedor");
    expect(profileDepois?.tenant_id).toBe(tenantId);
  });

  test("vendedor não consegue sequestrar outro tenant trocando o próprio tenant_id", async () => {
    const browserClient = createBrowserLikeClient();
    const { error: loginError } = await browserClient.auth.signInWithPassword({
      email: vendedorEmail,
      password: SENHA,
    });
    expect(loginError).toBeNull();

    await browserClient.from("profiles").update({ tenant_id: outroTenantId }).eq("id", vendedorId);

    const admin = createTestAdminClient();
    const { data: profileDepois } = await admin
      .from("profiles")
      .select("tenant_id")
      .eq("id", vendedorId)
      .single();

    expect(profileDepois?.tenant_id).toBe(tenantId);
  });
});
