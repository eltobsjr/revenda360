import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
  seedContratoCrediario,
  createTestAdminClient,
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

test.describe("Fase 21 — Renegociação de contrato", () => {
  let gestorEmail: string;
  let nomeRevenda: string;
  let contratoId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("reneg-gestor");
    nomeRevenda = `E2E Renegociacao ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Reneg E2E",
      nomeLoja: "Matriz",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "REN1A23",
        marca: "Fiat",
        modelo: "Cronos",
        valorCompra: 55000,
        precoVenda: 66000,
        status: "Vendido",
      },
    ]);

    const hoje = new Date();
    const vencida = new Date(hoje);
    vencida.setDate(vencida.getDate() - 20);
    const futura = new Date(hoje);
    futura.setDate(futura.getDate() + 15);

    const resultado = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente Renegociação E2E",
      parcelas: [
        {
          numero: 1,
          vencimento: vencida.toISOString().slice(0, 10),
          valor: 5000,
          status: "Paga",
          valorPago: 5000,
        },
        {
          numero: 2,
          vencimento: vencida.toISOString().slice(0, 10),
          valor: 5000,
          status: "Atrasada",
        },
        { numero: 3, vencimento: futura.toISOString().slice(0, 10), valor: 5000, status: "A vencer" },
      ],
    });
    contratoId = resultado.contratoId;
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor renegocia um contrato: parcelas antigas viram Renegociada e um carnê novo é gerado", async ({
    page,
  }) => {
    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");

    await expect(page.getByText("Cliente Renegociação E2E")).toBeVisible();
    await page.getByRole("button", { name: "Renegociar" }).click();

    await expect(page.getByText(/Saldo devedor atual/)).toBeVisible();
    await page.getByLabel("Nova quantidade de parcelas").fill("3");
    await page.getByLabel("Nova taxa de juros (% a.m.)").fill("0");

    await expect(page.getByText(/Parcela 1\/3/)).toBeVisible();
    await page.getByRole("button", { name: "Confirmar renegociação" }).click();

    await expect(page.getByText(/Saldo devedor atual/)).toHaveCount(0);

    const admin = createTestAdminClient();

    const { data: parcelasAntigas } = await admin
      .from("parcelas")
      .select("status")
      .eq("contrato_id", contratoId)
      .neq("numero", 1);
    expect(parcelasAntigas?.every((p) => p.status === "Renegociada")).toBe(true);

    const { data: contratoAntigo } = await admin
      .from("contratos_crediario")
      .select("status")
      .eq("id", contratoId)
      .single();
    expect(contratoAntigo?.status).toBe("Renegociado");

    const { data: novoContrato } = await admin
      .from("contratos_crediario")
      .select("id, qtd_parcelas, status")
      .eq("contrato_anterior_id", contratoId)
      .single();
    expect(novoContrato?.qtd_parcelas).toBe(3);
    expect(novoContrato?.status).toBe("Ativo");

    const { data: parcelasNovas, count } = await admin
      .from("parcelas")
      .select("status", { count: "exact" })
      .eq("contrato_id", novoContrato!.id);
    expect(count).toBe(3);
    expect(parcelasNovas?.every((p) => p.status === "A vencer")).toBe(true);
  });
});
