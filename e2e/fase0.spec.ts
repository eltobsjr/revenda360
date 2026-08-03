import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

// Não há autocadastro no app: revendas são provisionadas pelo dono da
// plataforma (painel administrativo, ainda não construído). Aqui simulamos
// exatamente esse provisionamento via Admin API + inserts diretos
// (createTenantWithGestor), como o painel fará — o teste só exercita o que o
// cliente final realmente vê: login com a senha temporária.
test.describe("Fase 0 — login, equipe, tema (tenant provisionado como o painel admin fará)", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("gestor");
    vendedorEmail = uniqueEmail("vendedor");
    nomeRevenda = `E2E Revenda ${Date.now()}`;

    const userId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId,
      nomeRevenda,
      nomeGestor: "Gestor E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("login -> dashboard -> equipe -> tema -> logout", async ({ page }) => {
    await test.step("login vai direto para o dashboard (conta já provisionada)", async () => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(gestorEmail);
      await page.getByLabel("Senha").fill(SENHA);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    await test.step("gestor cria um vendedor pela tela de Equipe", async () => {
      await page.getByRole("link", { name: "Equipe" }).click();
      await expect(page).toHaveURL(/\/equipe/);

      await page.getByLabel("Nome").fill("Vendedor E2E");
      await page.getByLabel("E-mail").fill(vendedorEmail);
      await page.getByRole("button", { name: "Adicionar à equipe" }).click();

      await expect(page.getByText("Usuário criado com sucesso.")).toBeVisible();
      await expect(page.getByRole("cell", { name: "Vendedor E2E" })).toBeVisible();
    });

    await test.step("tema alterna entre claro e escuro sem quebrar a tela", async () => {
      const html = page.locator("html");
      await expect(html).toHaveClass(/light/);
      await page.getByRole("button", { name: "Alternar tema claro/escuro" }).click();
      await expect(html).toHaveClass(/dark/);
    });

    await test.step("logout volta para o login", async () => {
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test("vendedor recém-criado consegue logar com a senha temporária", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(gestorEmail);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/equipe");
    await page.getByLabel("Nome").fill("Vendedor E2E");
    await page.getByLabel("E-mail").fill(vendedorEmail);
    await page.getByRole("button", { name: "Adicionar à equipe" }).click();

    const senhaTemporaria = await page.locator("p.font-mono").textContent();
    expect(senhaTemporaria).toBeTruthy();

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("E-mail").fill(vendedorEmail);
    await page.getByLabel("Senha").fill(senhaTemporaria!.trim());
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
