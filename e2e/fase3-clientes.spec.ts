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

test.describe("Fase 3 — Clientes", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("clientes-gestor");
    nomeRevenda = `E2E Clientes ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Clientes E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra um cliente pelo modal de cadastro rápido", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/clientes");

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill("Maria da Silva");
    await page.getByLabel("CPF").fill("123.456.789-00");
    await page.getByLabel("WhatsApp").fill("11999998888");
    await page.getByLabel("Cidade").fill("São Paulo");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("cell", { name: "Maria da Silva" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "123.456.789-00" })).toBeVisible();
  });

  test("gestor busca cliente por nome e por CPF", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/clientes");

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill("João Pereira");
    await page.getByLabel("CPF").fill("111.222.333-44");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill("Ana Souza");
    await page.getByLabel("CPF").fill("555.666.777-88");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByLabel("Buscar").fill("João");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/busca=Jo%C3%A3o/);
    await expect(page.getByRole("cell", { name: "João Pereira" })).toBeVisible();
    await expect(page.getByText("Ana Souza")).not.toBeVisible();

    await page.getByLabel("Buscar").fill("555.666.777-88");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page.getByRole("cell", { name: "Ana Souza" })).toBeVisible();
    await expect(page.getByText("João Pereira")).not.toBeVisible();
  });

  test("não permite cadastrar dois clientes com o mesmo CPF", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/clientes");

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill("Primeiro Cliente");
    await page.getByLabel("CPF").fill("999.888.777-66");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill("Segundo Cliente");
    await page.getByLabel("CPF").fill("999.888.777-66");
    await page.getByRole("button", { name: "Cadastrar cliente" }).click();

    await expect(page.getByText("Já existe um cliente com esse CPF.")).toBeVisible();
  });
});
