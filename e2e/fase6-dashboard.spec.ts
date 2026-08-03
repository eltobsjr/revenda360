import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedVenda,
  seedContratoCrediario,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 6 — Dashboard", () => {
  let gestorEmail: string;
  let gestorId: string;
  let nomeRevenda: string;
  let tenantId: string;
  let lojaId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("dash-gestor");
    nomeRevenda = `E2E Dashboard ${Date.now()}`;

    gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId: lId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Dashboard E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;
    lojaId = lId;
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor vê KPIs financeiros, aging de estoque e parcelas vencendo calculados a partir de dados reais", async ({
    page,
  }) => {
    const [veiculoAtivoRecenteId, , veiculoVendidoId] = await seedVeiculos(
      tenantId,
      lojaId,
      [
        {
          tipo: "carro",
          placa: "DSH1A11",
          marca: "Fiat",
          modelo: "Argo",
          valorCompra: 15000,
          precoVenda: 20000,
          status: "Disponível",
          dataEntrada: diasAtras(10),
        },
        {
          tipo: "moto",
          placa: "DSH2B22",
          marca: "Honda",
          modelo: "Biz 125",
          valorCompra: 22000,
          precoVenda: 30000,
          status: "Disponível",
          dataEntrada: diasAtras(100),
        },
        {
          tipo: "carro",
          placa: "DSH3C33",
          marca: "Renault",
          modelo: "Kwid",
          valorCompra: 14000,
          precoVenda: 18990,
          status: "Vendido",
          dataEntrada: diasAtras(5),
        },
      ],
    );

    await seedVenda(tenantId, {
      veiculoId: veiculoVendidoId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Comprador Dashboard E2E",
      valorFinal: 18990,
      dataVenda: hojeISO(),
    });

    // dataVenda de 6 meses atrás: o contrato em si não deve contar como
    // "venda no mês" — só a parcela em atraso interessa a este cenário.
    await seedContratoCrediario(tenantId, {
      veiculoId: veiculoAtivoRecenteId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Devedor Dashboard E2E",
      dataVenda: diasAtras(180),
      parcelas: [{ numero: 1, vencimento: diasAtras(5), valor: 800 }],
    });

    await logar(page, gestorEmail);
    await page.goto("/dashboard");

    // KPI "Em estoque": só os 2 veículos ativos contam (o vendido fica de fora).
    await expect(page.getByText("2 veíc.")).toBeVisible();
    await expect(page.getByText("R$ 50.000 imobilizado")).toBeVisible();

    // KPI "Vendas no mês": a venda seedada acontece hoje, sempre no mês corrente.
    await expect(page.getByText("1 vendas")).toBeVisible();
    await expect(page.getByText("R$ 18.990 fatur.")).toBeVisible();

    // KPI "Lucro líquido" (só gestor): 18990 - custoTotal(14000) - comissão(0) = 4990.
    await expect(page.getByText("Lucro líquido")).toBeVisible();
    await expect(page.getByText("R$ 4.990")).toBeVisible();

    // Aging de estoque: um veículo em "0–30 dias", outro em "+90 dias".
    await expect(page.getByText("0–30 dias")).toBeVisible();
    await expect(page.getByText("+90 dias")).toBeVisible();
    await expect(page.getByText("R$ 20.000,00")).toBeVisible();
    await expect(page.getByText("R$ 30.000,00")).toBeVisible();

    // Parcelas vencendo: a parcela em atraso seedada aparece no widget.
    await expect(page.getByText(/Devedor Dashboard E2E — Fiat Argo/)).toBeVisible();
    await expect(page.getByText("Atrasada")).toBeVisible();
  });

  test("vendedor não vê KPIs financeiros sensíveis (Lucro líquido, Margem média)", async ({
    page,
  }) => {
    const vendedorEmail = uniqueEmail("dash-vendedor");
    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Dashboard E2E",
      role: "vendedor",
    });

    await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "DSH4D44",
        marca: "Fiat",
        modelo: "Mobi",
        valorCompra: 12000,
        precoVenda: 16000,
        status: "Disponível",
      },
    ]);

    await logar(page, vendedorEmail);
    await page.goto("/dashboard");

    await expect(page.getByText("Em estoque", { exact: true })).toBeVisible();
    await expect(page.getByText("Lucro líquido")).not.toBeVisible();
    await expect(page.getByText("Margem média")).not.toBeVisible();

    // "Últimas movimentações" mostra a entrada em estoque, mas o valor da
    // entrada é o custo de aquisição — não pode aparecer para o vendedor.
    await expect(page.getByText("Entrada em estoque: Fiat Mobi")).toBeVisible();
    await expect(page.getByText("R$ 12.000,00")).not.toBeVisible();

    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });
});
