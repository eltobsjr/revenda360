import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
  seedCliente,
  seedContratoCrediario,
  cleanupTenantByName,
  deleteUserByEmail,
  createTestAdminClient,
} from "./helpers/admin";
import { calcularDiasAtraso, calcularJurosMulta } from "../lib/domain/juros";
import { formatBRL } from "../lib/format";

const SENHA = "SenhaForte123";

function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function diasAFrente(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 5 — Contas a receber", () => {
  let gestorEmail: string;
  let gestorId: string;
  let nomeRevenda: string;
  let tenantId: string;
  let lojaId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("receber-gestor");
    nomeRevenda = `E2E Receber ${Date.now()}`;

    gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId: lId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Receber E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;
    lojaId = lId;
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor dá baixa em parcela atrasada, aplicando juros e multa (2% + 0,1%/dia)", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB1A11",
        marca: "Honda",
        modelo: "CB 300F Twister",
        valorCompra: 14000,
        precoVenda: 18990,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "José Atraso E2E" });
    const vencimento = diasAtras(20);

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento, valor: 1000 }],
    });

    // Valores esperados calculados com a mesma fórmula do domínio
    // (multa_pct=2, mora_pct_dia=0.1 são os defaults de tenant_config), não
    // hardcoded — evita flakiness por causa da hora do dia em que o teste roda.
    const diasAtrasoEsperado = calcularDiasAtraso(vencimento, new Date());
    const jurosEsperado = calcularJurosMulta(1000, diasAtrasoEsperado, 2, 0.1);
    const valorFinalEsperado = 1000 + jurosEsperado;

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber");

    const linha = page.getByRole("row", { name: /José Atraso E2E/ });
    await expect(linha.getByText("Atrasada")).toBeVisible();

    await linha.getByRole("button", { name: "Dar baixa" }).click();
    await expect(page.getByText(/José Atraso E2E — Honda CB 300F Twister/)).toBeVisible();
    await expect(page.getByText(String(diasAtrasoEsperado)).first()).toBeVisible();
    await expect(page.getByText(formatBRL(jurosEsperado))).toBeVisible();
    await expect(page.getByText(formatBRL(valorFinalEsperado))).toBeVisible();

    await page.getByRole("button", { name: "Confirmar recebimento" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const admin = createTestAdminClient();
    const { data: parcela } = await admin
      .from("parcelas")
      .select("status, valor_pago, desconto_aplicado, juros_multa_aplicado, forma_pagamento")
      .eq("id", parcelas[0].id)
      .single();
    expect(parcela?.status).toBe("Paga");
    expect(parcela?.valor_pago).toBe(valorFinalEsperado);
    expect(parcela?.desconto_aplicado).toBe(0);
    expect(parcela?.juros_multa_aplicado).toBe(jurosEsperado);
    expect(parcela?.forma_pagamento).toBe("pix");
  });

  test("visão por contrato mostra progresso de pagamento e inadimplência agrupa por cliente", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB2B22",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 48000,
        precoVenda: 58900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, {
      nome: "Roberta Cobrança E2E",
      whatsapp: "(11) 98888-7777",
    });

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [
        {
          numero: 1,
          vencimento: diasAtras(40),
          valor: 1500,
          status: "Paga",
          valorPago: 1500,
          dataPagamento: diasAtras(40),
        },
        { numero: 2, vencimento: diasAtras(10), valor: 1500 },
        { numero: 3, vencimento: diasAFrente(20), valor: 1500 },
      ],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");

    await expect(page.getByText("Roberta Cobrança E2E")).toBeVisible();
    await expect(page.getByText("R$ 1.500,00 pago")).toBeVisible();
    await expect(page.getByText("R$ 3.000,00 saldo")).toBeVisible();

    await page.getByRole("link", { name: "Inadimplência" }).click();
    await expect(page).toHaveURL(/mode=inadimplencia/);
    const linha = page.getByRole("row", { name: /Roberta Cobrança E2E/ });
    await expect(linha.getByText("R$ 1.500,00")).toBeVisible();
    await expect(linha.getByText("1–15 dias")).toBeVisible();

    const linkCobrar = linha.getByRole("link", { name: "Cobrar" });
    await expect(linkCobrar).toHaveAttribute("href", /^https:\/\/wa\.me\/5511988887777\?text=/);
    await expect(linkCobrar).toHaveAttribute("target", "_blank");
  });
});
