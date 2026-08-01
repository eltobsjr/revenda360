import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  cleanupTenantByName,
  deleteUserByEmail,
} from "./helpers/admin";

const SENHA = "SenhaForte123";

// O Supabase (plano gratuito) tem um rate limit bem baixo de envio de e-mail
// de confirmação (poucos e-mails por hora no serviço embutido). Só este teste
// exercita o formulário real de /cadastro (que dispara um e-mail de verdade
// via supabase.auth.signUp) — os demais preparam o usuário via Admin API (sem
// e-mail) para poder rodar quantas vezes for preciso sem esbarrar no limite.
// Se este teste falhar com "Não foi possível criar a conta" mesmo com dados
// válidos, é provável que a cota de e-mail da hora tenha sido consumida —
// não é um bug da aplicação; rode de novo mais tarde ou configure um provedor
// SMTP próprio no projeto Supabase (ver Fase 4 pós-MVP do plano).
test("cadastro pelo formulário real envia e-mail de confirmação", async ({ page }) => {
  const email = uniqueEmail("cadastro-form");
  try {
    await page.goto("/cadastro");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(SENHA);
    await page.getByLabel("Confirme a senha").fill(SENHA);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Enviamos um link de confirmação")).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test.describe("Fase 0 — onboarding, equipe, tema (usuário preparado via Admin API)", () => {
  let gestorEmail: string;
  let vendedorEmail: string;
  let nomeRevenda: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("gestor");
    vendedorEmail = uniqueEmail("vendedor");
    nomeRevenda = `E2E Revenda ${Date.now()}`;
    await createConfirmedUser(gestorEmail, SENHA);
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("login -> onboarding -> equipe -> tema -> logout", async ({ page }) => {
    await test.step("login redireciona para onboarding (perfil ainda não existe)", async () => {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(gestorEmail);
      await page.getByLabel("Senha").fill(SENHA);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/onboarding/);
    });

    await test.step("onboarding cria tenant + loja + perfil gestor", async () => {
      await page.getByLabel("Nome da revenda").fill(nomeRevenda);
      await page.getByLabel("Seu nome").fill("Gestor E2E");
      await page.getByLabel("Nome da loja").fill("Matriz");
      await page.getByLabel("Cidade").fill("Belo Horizonte");
      await page.getByLabel("UF").selectOption("MG");
      await page
        .getByRole("button", { name: "Começar a usar o Revenda 360" })
        .click();
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText("Esta tela existe e é navegável")).toBeVisible();
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
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByLabel("Nome da revenda").fill(nomeRevenda);
    await page.getByLabel("Seu nome").fill("Gestor E2E");
    await page.getByLabel("Nome da loja").fill("Matriz");
    await page
      .getByRole("button", { name: "Começar a usar o Revenda 360" })
      .click();
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

    // Vendedor já tem perfil (criado pelo gestor) -> vai direto pro dashboard, não onboarding.
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
