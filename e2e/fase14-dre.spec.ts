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

test.describe("Fase 14 — DRE por veículo", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("dre-gestor");
    vendedorEmail = uniqueEmail("dre-vendedor");
    nomeRevenda = `E2E DRE ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor DRE E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor DRE E2E",
      role: "vendedor",
    });

    // custoTotal = 40000 (compra) + 1000 (custo lançado) = 41000
    // margem = 55000 (venda) - 41000 - 1100 (comissão) = 12900 -> 23,5%
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "DRE1A23",
        marca: "Toyota",
        modelo: "Etios",
        valorCompra: 40000,
        precoVenda: 55000,
        status: "Vendido",
        custo: 1000,
      },
    ]);

    await seedVenda(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente DRE E2E",
      valorFinal: 55000,
      comissaoValor: 1100,
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê a margem calculada corretamente pra uma venda de teste", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/dre");

    const linha = page.getByRole("row", { name: /Toyota Etios/ });
    await expect(linha).toBeVisible();
    await expect(linha.getByText("R$ 55.000,00")).toBeVisible();
    await expect(linha.getByText("R$ 40.000,00")).toBeVisible();
    await expect(linha.getByText("R$ 1.000,00")).toBeVisible();
    await expect(linha.getByText("R$ 1.100,00")).toBeVisible();
    await expect(linha.getByText("R$ 12.900,00")).toBeVisible();
    await expect(linha.getByText("23.5%")).toBeVisible();
  });

  test("vendedor não acessa DRE por veículo", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/financeiro/dre");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
