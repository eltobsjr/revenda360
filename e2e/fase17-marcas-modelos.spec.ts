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

test.describe("Fase 17 — Marcas/Modelos", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("marca-gestor");
    nomeRevenda = `E2E Marcas Modelos ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Marca E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra marca e modelo, e usa no cadastro de um veículo", async ({ page }) => {
    await logar(page, gestorEmail);

    // 1. Cadastra marca + modelo em /marcas-modelos
    await page.goto("/marcas-modelos");
    await page.getByRole("button", { name: "Nova marca" }).click();
    await page.getByLabel("Nome").fill("Marca Estruturada E2E");
    await page.getByRole("button", { name: "Cadastrar marca" }).click();
    await expect(page.getByText("Marca Estruturada E2E")).toBeVisible();

    await page.getByRole("button", { name: "Novo modelo" }).click();
    await page.getByLabel("Nome").fill("Modelo Estruturado E2E");
    await page.getByRole("button", { name: "Cadastrar modelo" }).click();
    await expect(page.getByText("Modelo Estruturado E2E")).toBeVisible();

    // 2. Usa marca/modelo cadastrados na Entrada de veículo
    await page.goto("/estoque/novo");
    await page.getByLabel("Placa", { exact: true }).fill("MAR1A23");
    await page.getByLabel("Selecionar do catálogo").selectOption({ label: "Marca Estruturada E2E" });
    await page.getByLabel("Modelo cadastrado").selectOption({ label: "Modelo Estruturado E2E" });
    await expect(page.getByLabel("Marca", { exact: true })).toHaveValue("Marca Estruturada E2E");
    await expect(page.getByLabel("Modelo", { exact: true })).toHaveValue("Modelo Estruturado E2E");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("45000");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("36000");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();

    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("heading", { name: /Marca Estruturada E2E Modelo Estruturado E2E/ }),
    ).toBeVisible();
  });

  test("gestor cadastra marca e modelo novos direto na Entrada de veículo, sem sair da tela", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/novo");

    await page.getByLabel("Placa", { exact: true }).fill("MAR2B34");

    await page.getByRole("button", { name: "Nova marca" }).click();
    await page.getByLabel("Nome").fill("Marca Inline E2E");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Marca", { exact: true })).toHaveValue("Marca Inline E2E");

    await page.getByRole("button", { name: "Novo modelo" }).click();
    await page.getByLabel("Nome").fill("Modelo Inline E2E");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Modelo", { exact: true })).toHaveValue("Modelo Inline E2E");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("52000");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("41000");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);

    await page.goto("/marcas-modelos");
    await expect(page.getByText("Marca Inline E2E")).toBeVisible();
    await expect(page.getByText("Modelo Inline E2E")).toBeVisible();
  });
});
