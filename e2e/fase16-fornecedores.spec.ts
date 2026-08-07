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

test.describe("Fase 16 — Fornecedores", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("fornec-gestor");
    nomeRevenda = `E2E Fornecedores ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Fornec E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra um fornecedor e linka a um veículo pela Entrada de veículo", async ({
    page,
  }) => {
    await logar(page, gestorEmail);

    // 1. Cadastra o fornecedor em /fornecedores
    await page.goto("/fornecedores");
    await page.getByRole("button", { name: "Novo fornecedor" }).click();
    await page.getByLabel("Nome").fill("Fornecedor Estruturado E2E");
    await page.getByLabel("Contato").fill("11955554444");
    await page.getByRole("button", { name: "Cadastrar fornecedor" }).click();
    await expect(page.getByRole("cell", { name: "Fornecedor Estruturado E2E" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Fornecedor Estruturado E2E/ })).toContainText("0");

    // 2. Linka o fornecedor cadastrado a um veículo novo
    await page.goto("/estoque/novo");
    await page.getByLabel("Placa", { exact: true }).fill("FOR1A23");
    await page.getByLabel("Marca").fill("Fiat");
    await page.getByLabel("Modelo", { exact: true }).fill("Uno");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Fornecedor cadastrado").selectOption({ label: "Fornecedor Estruturado E2E" });
    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("38000");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("30000");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);

    // 3. Contagem de veículos do fornecedor atualiza
    await page.goto("/fornecedores");
    await expect(page.getByRole("row", { name: /Fornecedor Estruturado E2E/ })).toContainText("1");
  });

  test("gestor cadastra um fornecedor novo direto na Entrada de veículo, sem sair da tela", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque/novo");

    await page.getByLabel("Placa", { exact: true }).fill("FOR2B34");
    await page.getByLabel("Marca").fill("Chevrolet");
    await page.getByLabel("Modelo", { exact: true }).fill("Onix");
    await page.getByRole("tab", { name: "Aquisição" }).click();

    await page.getByRole("button", { name: "Novo" }).click();
    await page.getByLabel("Nome").fill("Fornecedor Inline E2E");
    await page.getByRole("button", { name: "Cadastrar" }).click();
    // Dialog fecha e a opção recém-criada já aparece selecionada no select.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByLabel("Fornecedor cadastrado").locator("option:checked"),
    ).toHaveText("Fornecedor Inline E2E");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("42000");
    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Valor de compra").fill("34000");
    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);

    await page.goto("/fornecedores");
    await expect(page.getByRole("cell", { name: "Fornecedor Inline E2E" })).toBeVisible();
    await expect(page.getByRole("row", { name: /Fornecedor Inline E2E/ })).toContainText("1");
  });
});
