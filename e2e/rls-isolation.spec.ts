import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

async function logarEOnboardComoGestor(
  page: import("@playwright/test").Page,
  email: string,
  nomeRevenda: string,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Nome da revenda").fill(nomeRevenda);
  await page.getByLabel("Seu nome").fill("Gestor E2E");
  await page.getByLabel("Nome da loja").fill("Matriz");
  await page.getByRole("button", { name: "Começar a usar o Revenda 360" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("RLS — isolamento entre tenants", () => {
  let emailA: string;
  let emailB: string;
  let tenantA: string;
  let tenantB: string;

  test.beforeEach(async () => {
    const stamp = Date.now();
    emailA = uniqueEmail("tenantA");
    emailB = uniqueEmail("tenantB");
    tenantA = `E2E Isolamento A ${stamp}`;
    tenantB = `E2E Isolamento B ${stamp}`;
    await createConfirmedUser(emailA, SENHA);
    await createConfirmedUser(emailB, SENHA);
  });

  test.afterEach(async () => {
    await cleanupTenantByName(tenantA);
    await cleanupTenantByName(tenantB);
    await deleteUserByEmail(emailA).catch(() => {});
    await deleteUserByEmail(emailB).catch(() => {});
  });

  test("um tenant não vê a equipe/perfis de outro tenant", async ({ page }) => {
    await test.step("cria e configura tenant A", async () => {
      await logarEOnboardComoGestor(page, emailA, tenantA);
    });

    await test.step("tenant A vê só a si mesmo na Equipe", async () => {
      await page.goto("/equipe");
      await expect(page.getByRole("cell", { name: "Gestor E2E" })).toBeVisible();
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(1);
    });

    await test.step("sai e cria tenant B", async () => {
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/login/);
      await logarEOnboardComoGestor(page, emailB, tenantB);
    });

    await test.step("tenant B não enxerga o gestor do tenant A", async () => {
      await page.goto("/equipe");
      await expect(page.getByRole("cell", { name: "Gestor E2E" })).toBeVisible();
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(1); // só o próprio gestor do tenant B
    });
  });
});
