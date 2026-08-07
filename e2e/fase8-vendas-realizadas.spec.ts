import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedVenda,
  createTestAdminClient,
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

test.describe("Fase 8 — Vendas realizadas", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;
  let vendedorId: string;
  let vendaId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("vendas-gestor");
    vendedorEmail = uniqueEmail("vendas-vendedor");
    nomeRevenda = `E2E Vendas Realizadas ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Vendas E2E",
      nomeLoja: "Matriz",
    });

    vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Vendas E2E",
      role: "vendedor",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "VND1A23",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 60000,
        precoVenda: 72000,
        status: "Vendido",
      },
    ]);

    vendaId = await seedVenda(tenantId, {
      veiculoId,
      vendedorId,
      clienteNomeAvulso: "Cliente Balcão E2E",
      valorFinal: 72000,
      comissaoValor: 1440,
      dataVenda: "2026-06-15",
    });

    const admin = createTestAdminClient();
    await admin
      .from("vendas")
      .update({ comissao_pct: 2 })
      .eq("id", vendaId);
    await admin.from("venda_pagamentos").insert({
      tenant_id: tenantId,
      venda_id: vendaId,
      tipo: "pix",
      valor: 72000,
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê a venda com comissão e o detalhe de pagamento", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/realizadas");

    await expect(page.getByRole("cell", { name: /Fiat Argo/ })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Cliente Balcão E2E" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Comissão" })).toBeVisible();
    await expect(page.getByText("R$ 1.440,00")).toBeVisible();

    await page.getByRole("cell", { name: /Fiat Argo/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("PIX")).toBeVisible();
    await expect(page.getByText(/Comissão \(2%\)/)).toBeVisible();
  });

  test("vendedor não vê a coluna nem o valor de comissão", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/vendas/realizadas");

    await expect(page.getByRole("cell", { name: /Fiat Argo/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Comissão" })).toHaveCount(0);
    await expect(page.getByText("R$ 1.440,00")).toHaveCount(0);
  });

  test("filtro de período exclui a venda fora do intervalo", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/realizadas");
    await expect(page.getByRole("cell", { name: /Fiat Argo/ })).toBeVisible();

    await page.locator("#dataInicial").fill("2026-07-01");
    await page.getByRole("button", { name: "Filtrar" }).click();

    await expect(page).toHaveURL(/dataInicial=2026-07-01/);
    await expect(page.getByText("Nenhuma venda encontrada")).toBeVisible();
  });
});
