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

test.describe("Fase 15 — Consignados", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("consig-gestor");
    nomeRevenda = `E2E Consignados ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Consig E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra um consignado, vende, e vê o repasse virar conta a pagar", async ({
    page,
  }) => {
    await logar(page, gestorEmail);

    // 1. Cadastra o veículo consignado
    await page.goto("/estoque/novo");
    await page.getByLabel("Tipo:").selectOption("carro");
    await page.getByLabel("Placa", { exact: true }).fill("CSG1A23");
    await page.getByLabel("Marca").fill("Volkswagen");
    await page.getByLabel("Modelo", { exact: true }).fill("Gol");

    await page.getByRole("tab", { name: "Aquisição" }).click();
    await page.getByLabel("Origem").selectOption("Consignado");
    await page.getByLabel("Nome do consignante").fill("Consignante E2E");
    await page.getByLabel("Contato do consignante").fill("11977776666");
    await page.getByLabel("Valor de repasse combinado").fill("20000");

    await page.getByRole("tab", { name: "Precificação" }).click();
    await page.getByLabel("Preço de venda à vista").fill("25000");

    await page.getByRole("button", { name: "Cadastrar veículo" }).click();
    await expect(page).toHaveURL(/\/estoque\/[0-9a-f-]+$/);

    // 2. Aparece em Consignados > Disponíveis
    await page.goto("/estoque/consignados");
    await expect(page.getByText("Consignante E2E")).toBeVisible();
    await expect(page.getByText("R$ 20.000,00")).toBeVisible();

    // 3. Aparece pra venda em Nova venda (status "Consignado", não só "Disponível")
    await page.goto("/vendas/nova");
    await page.getByRole("button", { name: /Volkswagen Gol/ }).click();
    await page.getByRole("tab", { name: "Pagamento" }).click();
    await page.getByLabel("Entrada / à vista").fill("25000");
    await page.getByRole("tab", { name: "Confirmação" }).click();
    await page.getByRole("button", { name: "Confirmar venda" }).click();
    await expect(page).toHaveURL(/\/vendas\/realizadas/);

    // 4. Move pra "Vendidos" em Consignados, com comissão da revenda calculada (25000 - 20000)
    await page.goto("/estoque/consignados");
    await expect(page.getByText("Nenhum consignado disponível.")).toBeVisible();
    const linhaVendida = page.getByRole("row", { name: /Volkswagen Gol/ });
    await expect(linhaVendida).toBeVisible();
    await expect(linhaVendida.getByText("R$ 5.000,00")).toBeVisible();

    // 5. Repasse virou conta a pagar automaticamente
    await page.goto("/financeiro/pagar");
    const linhaContaPagar = page.getByRole("row", { name: /Repasse de consignação/ });
    await expect(linhaContaPagar).toBeVisible();
    await expect(linhaContaPagar.getByText("Consignante E2E")).toBeVisible();
    await expect(linhaContaPagar.getByText("R$ 20.000,00")).toBeVisible();
  });
});
