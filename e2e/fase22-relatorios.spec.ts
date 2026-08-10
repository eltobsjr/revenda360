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

  /** Mesma fórmula de `limitesDoMes` em baixar-pdf-vendas-button.tsx. */
  function limitesDoMesAtual(): { inicio: string; fim: string } {
    const hoje = new Date();
    const mesIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    const inicio = `${mesIso}-01`;
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { inicio, fim };
  }

  test("gestor escolhe período e tipo de relatório, e baixa o PDF correspondente", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/relatorios?aba=vendas");
    const { inicio, fim } = limitesDoMesAtual();

    await page.getByRole("button", { name: "Baixar PDF" }).click();
    const dialogGeral = page.getByRole("dialog");
    await expect(dialogGeral.getByRole("heading", { name: "Baixar PDF" })).toBeVisible();

    // Padrão: modo "Mensal" com o mês atual pré-selecionado.
    await expect(dialogGeral.getByLabel("Mês")).toHaveValue(inicio.slice(0, 7));

    const downloadGeral = page.waitForEvent("download");
    await dialogGeral.getByRole("button", { name: "Relatório geral (todos os status)" }).click();
    expect((await downloadGeral).suggestedFilename()).toBe(`vendas-recebiveis-${inicio}-a-${fim}.pdf`);

    // Reabre o diálogo, troca pra período personalizado e escolhe "A receber
    // — a vencer" — deve baixar um arquivo com o período customizado no nome.
    await page.getByRole("button", { name: "Baixar PDF" }).click();
    const dialogPersonalizado = page.getByRole("dialog");
    await dialogPersonalizado.getByRole("button", { name: "Data inicial a final" }).click();
    await dialogPersonalizado.getByLabel("De").fill("2026-01-01");
    await dialogPersonalizado.getByLabel("Até").fill("2026-12-31");

    const downloadAVencer = page.waitForEvent("download");
    await dialogPersonalizado.getByRole("button", { name: "A receber — a vencer" }).click();
    expect((await downloadAVencer).suggestedFilename()).toBe(
      "a-receber-a-vencer-2026-01-01-a-2026-12-31.pdf",
    );

    // Somente contas a pagar, ainda no período personalizado — arquivo
    // diferente, confirmando que a opção certa foi respeitada.
    await page.getByRole("button", { name: "Baixar PDF" }).click();
    const dialogPagar = page.getByRole("dialog");
    const downloadPagar = page.waitForEvent("download");
    await dialogPagar.getByRole("button", { name: "Somente contas a pagar" }).click();
    expect((await downloadPagar).suggestedFilename()).toBe("contas-a-pagar-2026-01-01-a-2026-12-31.pdf");
  });
});
