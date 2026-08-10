import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  adicionarMembro,
  seedVeiculos,
  seedVenda,
  createTestAdminClient,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

async function logar(page: import("@playwright/test").Page, email: string, senha = SENHA) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 23 — Perfil", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let financeiroEmail: string;
  let nomeRevenda: string;
  let tenantId: string;
  let lojaId: string;
  let vendedorId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("perfil-gestor");
    vendedorEmail = uniqueEmail("perfil-vendedor");
    financeiroEmail = uniqueEmail("perfil-financeiro");
    nomeRevenda = `E2E Perfil ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId: lId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Perfil E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;
    lojaId = lId;

    vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Perfil E2E",
      role: "vendedor",
    });

    const financeiroId = await createConfirmedUser(financeiroEmail, SENHA);
    await adicionarMembro({
      userId: financeiroId,
      tenantId,
      lojaId,
      nome: "Financeiro Perfil E2E",
      role: "financeiro",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "PRF1A23",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 30000,
        precoVenda: 40000,
        status: "Vendido",
      },
    ]);

    await seedVenda(tenantId, {
      veiculoId,
      vendedorId,
      clienteNomeAvulso: "Cliente Perfil E2E",
      valorFinal: 42000,
      comissaoValor: 1000,
    });

    const admin = createTestAdminClient();
    await admin.from("propostas").insert({
      tenant_id: tenantId,
      veiculo_id: veiculoId,
      cliente_nome_avulso: "Cliente Proposta E2E",
      valor_proposto: 39000,
      status: "Em aberto",
      vendedor_id: vendedorId,
    });
    await admin.from("leads").insert({
      tenant_id: tenantId,
      nome: "Lead Perfil E2E",
      vendedor_id: vendedorId,
      etapa: "Em contato",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
    await deleteUserByEmail(financeiroEmail).catch(() => {});
  });

  test("gestor vê estatísticas da revenda, troca o nome e troca a senha", async ({ page }) => {
    await logar(page, gestorEmail);

    await page.locator("header").getByRole("link", { name: /Gestor Perfil E2E/ }).click();
    await expect(page).toHaveURL(/\/perfil/);

    await expect(page.getByRole("heading", { name: "Gestor Perfil E2E" })).toBeVisible();
    await expect(page.getByText(gestorEmail)).toBeVisible();
    await expect(page.getByText(nomeRevenda)).toBeVisible();
    await expect(page.getByText("Matriz")).toBeVisible();

    await expect(page.getByText("Minha revenda")).toBeVisible();
    await expect(page.getByText("Lojas ativas")).toBeVisible();
    await expect(page.getByText("Membros ativos na equipe")).toBeVisible();

    await page.getByLabel("Nome").fill("Gestor Perfil Renomeado E2E");
    await page.getByRole("button", { name: "Salvar nome" }).click();
    await expect(page.getByText("Nome atualizado.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gestor Perfil Renomeado E2E" })).toBeVisible();

    const novaSenha = "NovaSenhaGestor789";
    await page.getByLabel("Nova senha").fill(novaSenha);
    await page.getByLabel("Confirmar senha").fill(novaSenha);
    await page.getByRole("button", { name: "Trocar senha" }).click();
    await expect(page.getByText("Senha atualizada.")).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await logar(page, gestorEmail, novaSenha);
  });

  test("vendedor vê a própria atividade, sem nenhum valor de comissão na página", async ({ page }) => {
    await logar(page, vendedorEmail);
    await page.goto("/perfil");

    await expect(page.getByText("Minha atividade")).toBeVisible();
    await expect(page.getByText("Vendas confirmadas")).toBeVisible();
    await expect(page.getByText("Faturamento gerado")).toBeVisible();
    await expect(page.getByText("R$ 42.000,00")).toBeVisible();
    await expect(page.getByText("Propostas em aberto")).toBeVisible();
    await expect(page.getByText("Leads em carteira")).toBeVisible();

    // Regra suprema do CLAUDE.md: comissão é gestor-only, mesmo a do
    // próprio vendedor não aparece aqui.
    await expect(page.getByText(/comiss[ãa]o/i)).toHaveCount(0);
    await expect(page.getByText("R$ 1.000,00")).toHaveCount(0);
  });

  test("financeiro vê o estado vazio honesto, sem dado inventado", async ({ page }) => {
    await logar(page, financeiroEmail);
    await page.goto("/perfil");

    await expect(page.getByText("Nenhum dado adicional disponível")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Financeiro Perfil E2E" })).toBeVisible();
  });
});
