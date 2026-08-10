import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTestAdminClient,
  createTenantWithGestor,
  seedPlatformAdmin,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

test.describe("Painel administrativo do dono da plataforma", () => {
  let adminEmail: string;
  let gestorEmail: string;
  let gestorNovoEmail: string;
  let nomeRevendaExistente: string;
  let nomeRevendaNova: string;

  test.beforeEach(async () => {
    adminEmail = uniqueEmail("platformadmin");
    gestorEmail = uniqueEmail("gestor");
    gestorNovoEmail = uniqueEmail("gestornovo");
    nomeRevendaExistente = `E2E Revenda Existente ${Date.now()}`;
    nomeRevendaNova = `E2E Revenda Nova ${Date.now()}`;

    const adminUserId = await createConfirmedUser(adminEmail, SENHA);
    await seedPlatformAdmin(adminUserId);

    const gestorUserId = await createConfirmedUser(gestorEmail, SENHA);
    await createTenantWithGestor({
      userId: gestorUserId,
      nomeRevenda: nomeRevendaExistente,
      nomeGestor: "Gestor E2E",
      nomeLoja: "Matriz",
    });
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevendaExistente);
    await cleanupTenantByName(nomeRevendaNova);
    await deleteUserByEmail(adminEmail).catch(() => {});
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(gestorNovoEmail).catch(() => {});
  });

  test("dono da plataforma provisiona uma revenda nova pelo formulário", async ({ page }) => {
    await test.step("login do dono da plataforma vai direto para /admin", async () => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(adminEmail);
      await page.getByLabel("Senha").fill(SENHA);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByRole("heading", { name: "Revendas" })).toBeVisible();
      await expect(page.getByRole("cell", { name: nomeRevendaExistente })).toBeVisible();
    });

    await test.step("preenche o formulário de nova revenda", async () => {
      await page.getByRole("link", { name: "Nova revenda" }).click();
      await expect(page).toHaveURL(/\/admin\/revendas\/nova/);

      await page.getByLabel("Nome da revenda").fill(nomeRevendaNova);
      await page.getByLabel("Nome do gestor").fill("Gestor Nova Revenda");
      await page.getByLabel("E-mail do gestor").fill(gestorNovoEmail);
      await page.getByLabel("Nome da loja").fill("Matriz Nova");
      await page.getByLabel("Cidade da loja").fill("Curitiba");
      await page.getByLabel("UF da loja").fill("PR");
      await page.getByRole("button", { name: "Criar revenda" }).click();

      await expect(page.getByText("Revenda criada com sucesso.")).toBeVisible();
    });

    await test.step("tenant + loja + gestor foram criados de fato no banco", async () => {
      const admin = createTestAdminClient();
      const { data: tenant } = await admin
        .from("tenants")
        .select("id, nome")
        .eq("nome", nomeRevendaNova)
        .single();
      expect(tenant).toBeTruthy();

      const { data: lojas } = await admin
        .from("lojas")
        .select("id, nome, cidade, uf")
        .eq("tenant_id", tenant!.id);
      expect(lojas).toHaveLength(1);
      expect(lojas![0].nome).toBe("Matriz Nova");
      expect(lojas![0].cidade).toBe("Curitiba");
      expect(lojas![0].uf).toBe("PR");

      const { data: profiles } = await admin
        .from("profiles")
        .select("nome, role")
        .eq("tenant_id", tenant!.id);
      expect(profiles).toHaveLength(1);
      expect(profiles![0].nome).toBe("Gestor Nova Revenda");
      expect(profiles![0].role).toBe("gestor");
    });
  });

  test("dono da plataforma exclui uma revenda, só depois de digitar o nome exato pra confirmar", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(adminEmail);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin/);

    const linha = page.getByRole("row", { name: new RegExp(nomeRevendaExistente) });
    await linha.getByRole("button", { name: "Excluir" }).click();

    const dialog = page.getByRole("dialog");
    const botaoConfirmar = dialog.getByRole("button", { name: "Excluir revenda definitivamente" });

    // Nome errado: botão continua desabilitado, nada é apagado.
    await dialog.getByLabel(`Digite "${nomeRevendaExistente}" para confirmar`).fill("nome errado");
    await expect(botaoConfirmar).toBeDisabled();

    await dialog.getByLabel(`Digite "${nomeRevendaExistente}" para confirmar`).fill(nomeRevendaExistente);
    await expect(botaoConfirmar).toBeEnabled();
    await botaoConfirmar.click();

    // O diálogo só fecha em caso de sucesso (fica aberto com erro senão) —
    // checar isso primeiro dá um sinal de falha bem mais claro do que ir
    // direto pra "a linha sumiu", que também dá falso positivo enquanto o
    // diálogo aberto deixa o fundo da página inert/oculto da árvore de
    // acessibilidade.
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(nomeRevendaExistente) })).toHaveCount(0);

    const admin = createTestAdminClient();
    const { data: tenant } = await admin.from("tenants").select("id").eq("nome", nomeRevendaExistente).maybeSingle();
    expect(tenant).toBeNull();

    const { data: authUsers } = await admin.auth.admin.listUsers();
    expect(authUsers.users.some((u) => u.email === gestorEmail)).toBe(false);
  });

  test("usuário de tenant normal não acessa o painel administrativo", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(gestorEmail);
    await page.getByLabel("Senha").fill(SENHA);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
