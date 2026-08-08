import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
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

test.describe("Fase 19 — Leads (CRM kanban)", () => {
  // Viewport largo o bastante pra caber as 6 colunas sem precisar de scroll
  // horizontal — arrastar via mouse não funciona bem com scroll no meio.
  test.use({ viewport: { width: 1920, height: 900 } });

  let gestorEmail: string;
  let nomeRevenda: string;
  let tenantId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("lead-gestor");
    nomeRevenda = `E2E Leads ${Date.now()}`;

    const gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Lead E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;

    await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "LED1A23",
        marca: "Hyundai",
        modelo: "HB20",
        valorCompra: 50000,
        precoVenda: 62000,
        status: "Disponível",
      },
    ]);
  });

  test.afterEach(async () => {
    const admin = createTestAdminClient();
    await admin.from("clientes").delete().eq("nome", "Lead Kanban E2E");
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor cadastra lead, arrasta pro Ganho e converte em venda", async ({ page }) => {
    await logar(page, gestorEmail);
    await page.goto("/vendas/leads");

    await page.getByRole("button", { name: "Novo lead" }).click();
    await page.getByLabel("Nome").fill("Lead Kanban E2E");
    await page.getByLabel("Contato (WhatsApp)").fill("11966665555");
    await page.getByLabel("Veículo de interesse").selectOption({ label: "Hyundai HB20" });
    await page.getByRole("button", { name: "Cadastrar lead" }).click();

    const card = page.getByText("Lead Kanban E2E");
    await expect(card).toBeVisible();

    const colunaGanho = page.getByRole("list", { name: "Ganho" });

    // dnd-kit exige uma distância mínima de movimento pra ativar o drag (assim
    // clique em botões dentro do card não dispara um drag por engano) —
    // Locator.dragTo() faz um único salto de mouse que o sensor não reconhece
    // como movimento contínuo, então simulamos o arraste manualmente aqui.
    const origem = await card.boundingBox();
    const destino = await colunaGanho.boundingBox();
    if (!origem || !destino) throw new Error("Não foi possível calcular a posição do drag.");
    await page.mouse.move(origem.x + origem.width / 2, origem.y + origem.height / 2);
    await page.mouse.down();
    const passos = 10;
    for (let i = 1; i <= passos; i++) {
      await page.mouse.move(
        origem.x + origem.width / 2 + ((destino.x + destino.width / 2 - origem.x - origem.width / 2) * i) / passos,
        origem.y + origem.height / 2 + ((destino.y + destino.height / 2 - origem.y - origem.height / 2) * i) / passos,
      );
    }
    await page.mouse.up();

    await expect(page.getByRole("button", { name: "Converter em venda", exact: true })).toBeVisible({
      timeout: 10000,
    });

    const admin = createTestAdminClient();
    await expect
      .poll(async () => {
        const { data } = await admin.from("leads").select("etapa").eq("tenant_id", tenantId).single();
        return data?.etapa;
      })
      .toBe("Ganho");

    await page.getByRole("button", { name: "Converter em venda", exact: true }).click();
    await expect(page).toHaveURL(/\/vendas\/nova\?clienteId=/);

    await page.getByRole("tab", { name: "Cliente" }).click();
    await expect(page.getByText("Lead Kanban E2E").first()).toBeVisible();
  });
});
