import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
  seedCliente,
  cleanupTenantByName,
  deleteUserByEmail,
  createTestAdminClient,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 4 — Nova venda", () => {
  let gestorEmail: string;
  let nomeRevenda: string;
  let tenantId: string;
  let veiculo1Id: string;
  let veiculo2Id: string;
  let clienteId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("venda-gestor");
    nomeRevenda = `E2E Venda ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Venda E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;

    const ids = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "VND1A11",
        marca: "Honda",
        modelo: "CG 160 Fan",
        valorCompra: 12800,
        precoVenda: 15990,
        status: "Disponível",
        custo: 420,
      },
      {
        tipo: "moto",
        placa: "VND2B22",
        marca: "Honda",
        modelo: "Elite 125",
        valorCompra: 9800,
        precoVenda: 12290,
        status: "Disponível",
        custo: 160,
      },
    ]);
    [veiculo1Id, veiculo2Id] = ids;

    clienteId = await seedCliente(tenantId, { nome: "Maria Compradora E2E", cpf: "999.111.222-33" });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor completa uma venda à vista simples (cliente balcão)", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/nova");

    await page.getByRole("button", { name: /Honda CG 160 Fan/ }).click();

    await page.getByRole("tab", { name: "Pagamento" }).click();
    await page.getByLabel("Entrada / à vista").fill("15990");

    await page.getByRole("tab", { name: "Confirmação" }).click();
    await expect(page.getByText("Cliente balcão")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar venda" }).click();

    await expect(page).toHaveURL(/\/vendas\/realizadas/);

    const admin = createTestAdminClient();
    const { data: venda } = await admin
      .from("vendas")
      .select("id, valor_final, cliente_id, status")
      .eq("veiculo_id", veiculo1Id)
      .single();
    expect(venda?.valor_final).toBe(15990);
    expect(venda?.cliente_id).toBeNull();
    expect(venda?.status).toBe("confirmada");

    const { data: veiculo } = await admin
      .from("veiculos")
      .select("status")
      .eq("id", veiculo1Id)
      .single();
    expect(veiculo?.status).toBe("Vendido");
  });

  test("gestor completa uma venda com crediário próprio e parcelas geradas", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/nova");

    await page.getByRole("button", { name: /Honda Elite 125/ }).click();

    await page.getByRole("tab", { name: "Cliente" }).click();
    await page.getByRole("button", { name: /Maria Compradora E2E/ }).click();

    await page.getByRole("tab", { name: "Pagamento" }).click();
    await page.getByLabel("Entrada / à vista").fill("3290");
    await page.getByLabel("Crediário próprio / carnê da loja").fill("9000");
    await expect(page.getByText("Composição completa")).toBeVisible();

    await page.getByRole("tab", { name: "Crediário" }).click();
    await page.getByRole("button", { name: "Gerar parcelas" }).click();
    await expect(page.getByText(/Parcela 1\/6/)).toBeVisible();
    await expect(page.getByText(/Parcela 6\/6/)).toBeVisible();

    await page.getByRole("tab", { name: "Confirmação" }).click();
    await expect(page.getByText("Maria Compradora E2E")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar venda" }).click();

    await expect(page).toHaveURL(/\/vendas\/realizadas/);

    const admin = createTestAdminClient();
    const { data: venda } = await admin
      .from("vendas")
      .select("id, valor_final, cliente_id")
      .eq("veiculo_id", veiculo2Id)
      .single();
    expect(venda?.valor_final).toBe(12290);
    expect(venda?.cliente_id).toBe(clienteId);

    const { data: contrato } = await admin
      .from("contratos_crediario")
      .select("id, qtd_parcelas")
      .eq("venda_id", venda!.id)
      .single();
    expect(contrato?.qtd_parcelas).toBe(6);

    const { data: parcelas, count } = await admin
      .from("parcelas")
      .select("status", { count: "exact" })
      .eq("contrato_id", contrato!.id);
    expect(count).toBe(6);
    expect(parcelas?.every((p) => p.status === "A vencer")).toBe(true);

    const { data: veiculo } = await admin
      .from("veiculos")
      .select("status")
      .eq("id", veiculo2Id)
      .single();
    expect(veiculo?.status).toBe("Vendido");
  });
});
