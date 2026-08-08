import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  createTestAdminClient,
  seedVeiculos,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Segurança — vazamento de custo de aquisição em Avaliação/Troca (achado crítico da auditoria de 2026-08-08)", () => {
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    vendedorEmail = uniqueEmail("vazamento-vendedor");
    nomeRevenda = `E2E Vazamento ${Date.now()}`;

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: vendedorId,
      nomeRevenda,
      nomeGestor: "Vendedor Vazamento E2E",
      nomeLoja: "Matriz",
    });

    const admin = createTestAdminClient();
    await admin.from("profiles").update({ role: "vendedor" }).eq("id", vendedorId);

    const [veiculoVendidoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "VAZ1A23",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 40000,
        precoVenda: 50000,
        status: "Vendido",
      },
    ]);

    const { data: venda } = await admin
      .from("vendas")
      .insert({
        tenant_id: tenantId,
        veiculo_id: veiculoVendidoId,
        vendedor_id: vendedorId,
        cliente_nome_avulso: "Cliente Troca E2E",
        valor_venda: 50000,
        valor_final: 50000,
        data_venda: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();

    // Pagamento tipo "troca" — o valor aqui é exatamente o custo de
    // aquisição do veículo recebido, que o achado crítico expunha a
    // qualquer role em /estoque/avaliacao-troca.
    await admin.from("venda_pagamentos").insert({
      tenant_id: tenantId,
      venda_id: venda!.id,
      tipo: "troca",
      valor: 27500,
      detalhes: { descricao: "Honda Pop 110i 2018" },
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("vendedor não vê o valor da troca pendente em /estoque/avaliacao-troca", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/estoque/avaliacao-troca");

    await expect(page.getByText("Honda Pop 110i 2018")).toBeVisible();
    await expect(page.getByText("R$ 27.500,00")).toHaveCount(0);
  });
});
