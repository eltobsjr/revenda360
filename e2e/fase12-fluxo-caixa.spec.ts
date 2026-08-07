import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedVenda,
  seedContratoCrediario,
  createTestAdminClient,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function labelMesAtual(): string {
  const hoje = new Date();
  return `${MESES_ABREV[hoje.getMonth()]}/${String(hoje.getFullYear()).slice(2)}`;
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 12 — Fluxo de caixa", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("caixa-gestor");
    vendedorEmail = uniqueEmail("caixa-vendedor");
    nomeRevenda = `E2E Fluxo Caixa ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Caixa E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Caixa E2E",
      role: "vendedor",
    });

    const [veiculoVista, veiculoCrediario] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "CXA1A23",
        marca: "Fiat",
        modelo: "Mobi",
        valorCompra: 40000,
        precoVenda: 50000,
        status: "Vendido",
        custo: 2000,
      },
      {
        tipo: "carro",
        placa: "CXA2B34",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 55000,
        precoVenda: 68000,
        status: "Vendido",
      },
    ]);

    const admin = createTestAdminClient();

    const vendaVistaId = await seedVenda(tenantId, {
      veiculoId: veiculoVista,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente Caixa E2E",
      valorFinal: 15000,
    });
    await admin.from("venda_pagamentos").insert({
      tenant_id: tenantId,
      venda_id: vendaVistaId,
      tipo: "pix",
      valor: 15000,
    });

    await seedContratoCrediario(tenantId, {
      veiculoId: veiculoCrediario,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente Crediário E2E",
      parcelas: [
        {
          numero: 1,
          vencimento: hojeIso(),
          valor: 5000,
          status: "Paga",
          valorPago: 5000,
          dataPagamento: hojeIso(),
        },
      ],
    });

    await admin.from("contas_pagar").insert({
      tenant_id: tenantId,
      descricao: "Aluguel E2E Caixa",
      valor: 3000,
      vencimento: hojeIso(),
      status: "Paga",
      valor_pago: 3000,
      data_pagamento: hojeIso(),
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê entradas, saídas e saldo do mês atual calculados a partir de dados reais", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/fluxo-caixa");

    const linha = page.getByRole("row", { name: new RegExp(`^${labelMesAtual()}`) });
    await expect(linha).toBeVisible();
    await expect(linha.getByText("R$ 20.000,00")).toBeVisible(); // 15000 (pix) + 5000 (parcela)
    await expect(linha.getByText("R$ 5.000,00")).toBeVisible(); // 2000 (custo) + 3000 (conta paga)
  });

  test("vendedor não acessa Fluxo de caixa", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/financeiro/fluxo-caixa");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
