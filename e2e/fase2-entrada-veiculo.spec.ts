import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
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

test.describe("Fase 2 — Entrada de veículo", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("entrada-gestor");
    nomeRevenda = `E2E Entrada ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Entrada E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra uma moto informando campos específicos de moto", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/novo");

    await page.getByLabel("Placa", { exact: true }).fill("TST9Z99");
    await page.getByLabel("Marca").fill("Honda");
    await page.getByLabel("Modelo", { exact: true }).fill("CG 160 Fan");
    await page.getByLabel("KM atual").fill("15000");
    await page.getByLabel("Cilindrada (cc)").fill("160");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Valor FIPE").fill("16200");
    await page.getByLabel("Preço de venda à vista").fill("15990");

    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("12800");

    await page.getByRole("button", { name: "Cadastrar veículo" }).click();

    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: /Honda CG 160 Fan/ })).toBeVisible();
    await expect(page.getByText("Street")).toBeVisible();
  });

  test("gestor cadastra um carro informando campos específicos de carro", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/novo");

    await page.getByLabel("Tipo:").selectOption("carro");

    await page.getByLabel("Placa", { exact: true }).fill("TST8Y88");
    await page.getByLabel("Marca").fill("Toyota");
    await page.getByLabel("Modelo", { exact: true }).fill("Corolla");
    await page.getByLabel("KM atual").fill("30000");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Valor FIPE").fill("95000");
    await page.getByLabel("Preço de venda à vista").fill("89000");

    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("70000");

    await page.getByRole("button", { name: "Cadastrar veículo" }).click();

    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: /Toyota Corolla/ })).toBeVisible();
    await expect(page.getByText("Hatch")).toBeVisible();
  });

  test("gestor edita um veículo existente e a alteração é refletida na ficha", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/novo");
    await page.getByLabel("Placa", { exact: true }).fill("TST7X77");
    await page.getByLabel("Marca").fill("Yamaha");
    await page.getByLabel("Modelo", { exact: true }).fill("Fazer 250");
    await page.getByLabel("KM atual").fill("5000");
    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("18000");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("14000");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);

    await page.getByRole("link", { name: "Editar" }).click();
    await expect(page).toHaveURL(/\/editar$/);
    await page.getByLabel("Modelo", { exact: true }).fill("Fazer 250 Blueflex");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: /Fazer 250 Blueflex/ })).toBeVisible();
  });
});
