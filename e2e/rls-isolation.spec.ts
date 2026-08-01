import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

async function logarComoGestor(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
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

    const userIdA = await createConfirmedUser(emailA, SENHA);
    await createTenantWithGestor({
      userId: userIdA,
      nomeRevenda: tenantA,
      nomeGestor: "Gestor E2E",
      nomeLoja: "Matriz",
    });

    const userIdB = await createConfirmedUser(emailB, SENHA);
    await createTenantWithGestor({
      userId: userIdB,
      nomeRevenda: tenantB,
      nomeGestor: "Gestor E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(tenantA);
    await cleanupTenantByName(tenantB);
    await deleteUserByEmail(emailA).catch(() => {});
    await deleteUserByEmail(emailB).catch(() => {});
  });

  test("um tenant não vê a equipe/perfis de outro tenant", async ({ page }) => {
    await test.step("tenant A vê só a si mesmo na Equipe", async () => {
      await logarComoGestor(page, emailA);
      await page.goto("/equipe");
      await expect(page.getByRole("cell", { name: "Gestor E2E" })).toBeVisible();
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(1);
    });

    await test.step("sai e loga no tenant B", async () => {
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/login/);
      await logarComoGestor(page, emailB);
    });

    await test.step("tenant B não enxerga o gestor do tenant A", async () => {
      await page.goto("/equipe");
      await expect(page.getByRole("cell", { name: "Gestor E2E" })).toBeVisible();
      const rows = page.locator("tbody tr");
      await expect(rows).toHaveCount(1); // só o próprio gestor do tenant B
    });
  });
});
