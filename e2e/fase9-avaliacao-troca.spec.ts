import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
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

test.describe("Fase 9 — Avaliação/Troca", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("troca-gestor");
    nomeRevenda = `E2E Avaliacao Troca ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Troca E2E",
      nomeLoja: "Matriz",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "TRC1A23",
        marca: "Chevrolet",
        modelo: "Onix",
        valorCompra: 55000,
        precoVenda: 68000,
        status: "Vendido",
      },
    ]);

    const vendaId = await seedVenda(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente Troca E2E",
      valorFinal: 68000,
    });

    const admin = createTestAdminClient();
    await admin.from("venda_pagamentos").insert({
      tenant_id: tenantId,
      venda_id: vendaId,
      tipo: "troca",
      valor: 8000,
      detalhes: { descricao: "Honda Biz 2015 branca" },
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor completa o cadastro de um veículo recebido na troca", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/avaliacao-troca");

    await expect(page.getByText("Honda Biz 2015 branca")).toBeVisible();
    await expect(page.getByText("R$ 8.000,00")).toBeVisible();

    await page.getByRole("link", { name: "Completar cadastro" }).click();
    await expect(page).toHaveURL(/\/estoque\/avaliacao-troca\/[0-9a-f-]+$/);

    await page.getByRole("tab", { name: "Aquisição" }).click();
    await expect(page.getByLabel("Valor de compra")).toHaveValue("8000");
    await page.getByRole("tab", { name: "Identificação" }).click();

    await page.getByLabel("Placa", { exact: true }).fill("TRC2B34");
    await page.getByLabel("Marca").fill("Honda");
    await page.getByLabel("Modelo", { exact: true }).fill("Biz 125");
    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("9500");

    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: /Honda Biz 125/ })).toBeVisible();

    await page.goto("/estoque");
    await expect(page.getByRole("cell", { name: /Honda Biz 125/ })).toBeVisible();

    await page.goto("/estoque/avaliacao-troca");
    await expect(page.getByText("Nenhuma troca pendente")).toBeVisible();
  });
});
