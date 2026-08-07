import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
  seedCliente,
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

test.describe("Fase 20 — Propostas", () => {
  let gestorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("proposta-gestor");
    nomeRevenda = `E2E Propostas ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Proposta E2E",
      nomeLoja: "Matriz",
    });

    await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "PRP1A23",
        marca: "Jeep",
        modelo: "Renegade",
        valorCompra: 70000,
        precoVenda: 89000,
        status: "Disponível",
      },
    ]);
    await seedCliente(tenantId, { nome: "Cliente Proposta E2E" });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra proposta, aceita, baixa PDF e converte em venda pré-preenchida", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/propostas");

    await page.getByRole("button", { name: "Nova proposta" }).click();
    await page.getByLabel("Veículo").selectOption({ label: "Jeep Renegade" });
    await page.getByLabel("Cliente cadastrado").selectOption({ label: "Cliente Proposta E2E" });
    await page.getByLabel("Valor proposto (R$)").fill("85000");
    await page.getByLabel("Condições").fill("Entrada + financiamento");
    await page.getByRole("button", { name: "Cadastrar proposta" }).click();

    const linha = page.getByRole("row", { name: /Jeep Renegade/ });
    await expect(linha).toBeVisible();
    await expect(linha.getByText("Em aberto")).toBeVisible();

    await linha.getByRole("button", { name: "Aceita" }).click();
    await expect(linha.getByText("Aceita")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await linha.getByRole("button", { name: "Baixar PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");

    await linha.getByRole("button", { name: "Converter em venda" }).click();
    await expect(page).toHaveURL(/\/vendas\/nova\?.*clienteId=/);

    await page.getByRole("tab", { name: "Confirmação" }).click();
    await expect(page.getByText("Jeep Renegade")).toBeVisible();
    await expect(page.getByText("Cliente Proposta E2E")).toBeVisible();
    await expect(page.getByText("R$ 85.000,00").first()).toBeVisible();
  });
});
