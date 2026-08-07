import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedVenda,
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

test.describe("Fase 13 — Comissões", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("comissao-gestor");
    vendedorEmail = uniqueEmail("comissao-vendedor");
    nomeRevenda = `E2E Comissoes ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Comissao E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Comissao E2E",
      role: "vendedor",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "CMS1A23",
        marca: "Renault",
        modelo: "Kwid",
        valorCompra: 45000,
        precoVenda: 55000,
        status: "Vendido",
      },
    ]);

    await seedVenda(tenantId, {
      veiculoId,
      vendedorId,
      clienteNomeAvulso: "Cliente Comissao E2E",
      valorFinal: 55000,
      comissaoValor: 1100,
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê comissão pendente do vendedor e marca como paga", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/comissoes");

    await expect(page.getByText("Vendedor Comissao E2E")).toBeVisible();
    await expect(page.getByText("R$ 1.100,00").first()).toBeVisible();

    await page.getByText("Vendedor Comissao E2E").click();
    await expect(page.getByText(/Cliente Comissao E2E/)).toBeVisible();

    await page.getByRole("button", { name: "Marcar como paga" }).click();
    await expect(page.getByRole("button", { name: "Marcar como paga" })).toHaveCount(0);
  });

  test("vendedor não acessa Comissões", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/financeiro/comissoes");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
