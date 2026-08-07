import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedCliente,
  seedContratoCrediario,
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

test.describe("Fase 10 — Clientes completo", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;
  let clienteId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("cliente-gestor");
    vendedorEmail = uniqueEmail("cliente-vendedor");
    nomeRevenda = `E2E Clientes Completo ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Cliente E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Cliente E2E",
      role: "vendedor",
    });

    clienteId = await seedCliente(tenantId, {
      nome: "Cliente Ficha E2E",
      cpf: "11122233344",
      whatsapp: "11988887777",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "FIC1A23",
        marca: "Hyundai",
        modelo: "HB20",
        valorCompra: 50000,
        precoVenda: 62000,
        status: "Vendido",
      },
    ]);

    const hoje = new Date();
    const vencida = new Date(hoje);
    vencida.setDate(vencida.getDate() - 15);
    const futura = new Date(hoje);
    futura.setDate(futura.getDate() + 30);

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [
        {
          numero: 1,
          vencimento: vencida.toISOString().slice(0, 10),
          valor: 31000,
          status: "Atrasada",
        },
        {
          numero: 2,
          vencimento: futura.toISOString().slice(0, 10),
          valor: 31000,
          status: "A vencer",
        },
      ],
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor abre a ficha, edita dados, e vê histórico e financeiro do cliente", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/clientes");
    await page.getByRole("cell", { name: "Cliente Ficha E2E" }).click();

    await expect(page).toHaveURL(new RegExp(`/clientes/${clienteId}`));
    await expect(page.getByRole("heading", { name: "Cliente Ficha E2E" })).toBeVisible();
    await expect(page.getByLabel("CPF")).toHaveValue("11122233344");

    await page.getByLabel("WhatsApp").fill("11999998888");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Dados salvos.")).toBeVisible();

    await page.goto("/clientes");
    await expect(page.getByRole("cell", { name: "11999998888" })).toBeVisible();

    await page.goto(`/clientes/${clienteId}`);
    await page.getByRole("tab", { name: "Histórico de compras" }).click();
    await expect(page.getByRole("cell", { name: /Hyundai HB20/ })).toBeVisible();

    await page.getByRole("tab", { name: "Financeiro" }).click();
    await expect(page.getByText("Atrasada")).toBeVisible();
    await expect(page.getByRole("button", { name: "Dar baixa" }).first()).toBeVisible();
  });

  test("vendedor não vê o CPF na ficha do cliente", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto(`/clientes/${clienteId}`);

    await expect(page.getByRole("heading", { name: "Cliente Ficha E2E" })).toBeVisible();
    await expect(page.getByLabel("CPF")).toHaveCount(0);
  });
});
