import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

function dataIso(offsetDias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 11 — Contas a pagar", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("pagar-gestor");
    vendedorEmail = uniqueEmail("pagar-vendedor");
    nomeRevenda = `E2E Contas Pagar ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Pagar E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Pagar E2E",
      role: "vendedor",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor cadastra uma conta a pagar futura e dá baixa nela", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/pagar");

    await page.getByRole("button", { name: "Nova conta" }).click();
    await page.getByLabel("Descrição").fill("Aluguel E2E");
    await page.getByLabel("Categoria").fill("Aluguel");
    await page.getByLabel("Fornecedor").fill("Imobiliária E2E");
    await page.getByLabel("Valor (R$)").fill("2500");
    await page.getByLabel("Vencimento").fill(dataIso(5));
    await page.getByRole("button", { name: "Cadastrar conta" }).click();

    const linha = page.getByRole("row", { name: /Aluguel E2E/ });
    await expect(linha).toBeVisible();
    await expect(linha.getByText("A vencer")).toBeVisible();

    await linha.getByRole("button", { name: "Dar baixa" }).click();
    await page.getByRole("button", { name: "Confirmar pagamento" }).click();

    await expect(page.getByRole("row", { name: /Aluguel E2E/ }).getByText("Paga")).toBeVisible();
  });

  test("conta com vencimento no passado aparece como Atrasada", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/pagar");

    await page.getByRole("button", { name: "Nova conta" }).click();
    await page.getByLabel("Descrição").fill("Conta Vencida E2E");
    await page.getByLabel("Valor (R$)").fill("800");
    await page.getByLabel("Vencimento").fill(dataIso(-10));
    await page.getByRole("button", { name: "Cadastrar conta" }).click();

    const linha = page.getByRole("row", { name: /Conta Vencida E2E/ });
    await expect(linha.getByText("Atrasada")).toBeVisible();
  });

  test("vendedor não acessa Contas a pagar", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/financeiro/pagar");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
