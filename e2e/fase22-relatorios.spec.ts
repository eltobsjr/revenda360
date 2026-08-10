import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedContratoCrediario,
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

test.describe("Fase 22 — Relatórios", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("relatorios-gestor");
    vendedorEmail = uniqueEmail("relatorios-vendedor");
    nomeRevenda = `E2E Relatorios ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Relatorios E2E",
      nomeLoja: "Matriz",
    });

    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Relatorios E2E",
      role: "vendedor",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "REL1A23",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 30000,
        precoVenda: 40000,
        status: "Disponível",
      },
    ]);

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteNomeAvulso: "Cliente Relatorios E2E",
      parcelas: [
        { numero: 1, vencimento: dataIso(-10), valor: 1000, status: "A vencer" },
        { numero: 2, vencimento: dataIso(20), valor: 1000, status: "A vencer" },
      ],
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("gestor vê o resumo de estoque, vendas/recebíveis e contas a pagar", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/relatorios");

    const linhaEstoque = page.getByRole("row", { name: /Disponível/ });
    await expect(linhaEstoque).toBeVisible();
    await expect(linhaEstoque.getByText("R$ 40.000,00")).toBeVisible();
    await expect(linhaEstoque.getByText("R$ 30.000,00")).toBeVisible();

    const abas = page.getByRole("navigation", { name: "Relatórios" });
    await abas.getByRole("link", { name: "Vendas & Recebíveis" }).click();
    await expect(page).toHaveURL(/aba=vendas/);
    const linhaAtrasada = page.getByRole("row", { name: /Atrasada/ });
    await expect(linhaAtrasada).toBeVisible();
    await expect(linhaAtrasada.getByText("R$ 1.000,00")).toBeVisible();

    await abas.getByRole("link", { name: "Contas a pagar" }).click();
    await expect(page).toHaveURL(/aba=pagar/);
    await expect(page.getByText("Nenhuma conta a pagar registrada.")).toBeVisible();
  });

  test("vendedor não acessa Relatórios (redirecionado pro Dashboard)", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/relatorios");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/relatorios?aba=vendas");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("gestor baixa o PDF de Vendas & Recebíveis", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/relatorios?aba=vendas");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".pdf");
  });
});
