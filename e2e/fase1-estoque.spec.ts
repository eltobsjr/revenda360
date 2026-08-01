import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
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

test.describe("Fase 1 — Estoque e Ficha do veículo", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;
  let veiculoCarroId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("estoque-gestor");
    vendedorEmail = uniqueEmail("estoque-vendedor");
    nomeRevenda = `E2E Estoque ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Estoque E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Estoque E2E",
      role: "vendedor",
    });

    const ids = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "TST1A23",
        marca: "Toyota",
        modelo: "Corolla",
        valorCompra: 90000,
        precoVenda: 108000,
        status: "Disponível",
        custo: 2000,
      },
      {
        tipo: "moto",
        placa: "TST2B34",
        marca: "Honda",
        modelo: "CG 160",
        valorCompra: 12000,
        precoVenda: 15000,
        status: "Reservado",
        custo: 300,
      },
    ]);
    veiculoCarroId = ids[0];
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê a lista completa com margem e pode filtrar por tipo", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/estoque");

    await expect(page.getByText("2 veículos no estoque")).toBeVisible();
    await expect(page.getByRole("cell", { name: /Toyota Corolla/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Margem" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Compra" })).toBeVisible();

    await page.getByLabel("Tipo").selectOption("moto");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(/tipo=moto/);
    await expect(page.getByRole("cell", { name: /Honda CG 160/ })).toBeVisible();
    await expect(page.getByText("Toyota Corolla")).not.toBeVisible();
  });

  test("gestor abre a Ficha do veículo e vê todas as abas, incluindo Financeiro", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto(`/estoque/${veiculoCarroId}`);

    await expect(page.getByRole("heading", { name: /Toyota Corolla/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Resumo" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Financeiro" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Documentação" })).toBeVisible();

    await page.getByRole("tab", { name: "Financeiro" }).click();
    await expect(page.getByText("Custos lançados").first()).toBeVisible();
    await expect(page.getByText("R$ 2.000,00").first()).toBeVisible();
  });

  test("vendedor não vê colunas financeiras na lista nem a aba Financeiro na Ficha", async ({
    page,
  }) => {
    await logar(page, vendedorEmail);
    await page.goto("/estoque");

    await expect(page.getByRole("columnheader", { name: "Margem" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Compra" })).toHaveCount(0);

    await page.goto(`/estoque/${veiculoCarroId}`);
    await expect(page.getByRole("tab", { name: "Resumo" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Financeiro" })).toHaveCount(0);
  });
});
