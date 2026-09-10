import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  createConfirmedUser,
  createTenantWithGestor,
  seedVeiculos,
  seedCliente,
  seedContratoCrediario,
  cleanupTenantByName,
  deleteUserByEmail,
  createTestAdminClient,
  adicionarMembro,
} from "./helpers/admin";
import { calcularDiasAtraso, calcularJurosMulta } from "../lib/domain/juros";
import { formatBRL } from "../lib/format";

const SENHA = "SenhaForte123";

function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function diasAFrente(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function logar(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Fase 5 — Contas a receber", () => {
  let gestorEmail: string;
  let gestorId: string;
  let nomeRevenda: string;
  let tenantId: string;
  let lojaId: string;

  test.beforeEach(async () => {
    gestorEmail = uniqueEmail("receber-gestor");
    nomeRevenda = `E2E Receber ${Date.now()}`;

    gestorId = await createConfirmedUser(gestorEmail, SENHA);
    const { tenantId: tId, lojaId: lId } = await createTenantWithGestor({
      userId: gestorId,
      nomeRevenda,
      nomeGestor: "Gestor Receber E2E",
      nomeLoja: "Matriz",
    });
    tenantId = tId;
    lojaId = lId;
  });

  test.afterEach(async () => {
    await cleanupTenantByName(nomeRevenda);
    await deleteUserByEmail(gestorEmail).catch(() => {});
  });

  test("gestor dá baixa em parcela atrasada, aplicando juros e multa (2% + 0,1%/dia)", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB1A11",
        marca: "Honda",
        modelo: "CB 300F Twister",
        valorCompra: 14000,
        precoVenda: 18990,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "José Atraso E2E" });
    const vencimento = diasAtras(20);

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento, valor: 1000 }],
    });

    // Valores esperados calculados com a mesma fórmula do domínio
    // (multa_pct=2, mora_pct_dia=0.1 são os defaults de tenant_config), não
    // hardcoded — evita flakiness por causa da hora do dia em que o teste roda.
    const diasAtrasoEsperado = calcularDiasAtraso(vencimento, new Date());
    const jurosEsperado = calcularJurosMulta(1000, diasAtrasoEsperado, 2, 0.1);
    const valorFinalEsperado = 1000 + jurosEsperado;

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    const linha = page.getByRole("row", { name: /José Atraso E2E/ });
    await expect(linha.getByText("Atrasada")).toBeVisible();

    await linha.getByRole("button", { name: "Dar baixa" }).click();
    await expect(page.getByText(/José Atraso E2E — Honda CB 300F Twister/)).toBeVisible();
    await expect(page.getByText(String(diasAtrasoEsperado)).first()).toBeVisible();
    await expect(page.getByText(formatBRL(jurosEsperado))).toBeVisible();
    await expect(page.getByText(formatBRL(valorFinalEsperado))).toBeVisible();

    await page.getByRole("button", { name: "Confirmar recebimento" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const admin = createTestAdminClient();
    const { data: parcela } = await admin
      .from("parcelas")
      .select("status, valor_pago, desconto_aplicado, juros_multa_aplicado, forma_pagamento")
      .eq("id", parcelas[0].id)
      .single();
    expect(parcela?.status).toBe("Paga");
    expect(parcela?.valor_pago).toBe(valorFinalEsperado);
    expect(parcela?.desconto_aplicado).toBe(0);
    expect(parcela?.juros_multa_aplicado).toBe(jurosEsperado);
    expect(parcela?.forma_pagamento).toBe("pix");
  });

  test("visão por contrato mostra progresso de pagamento e situação dos clientes agrupa por cliente com valor pendente", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB2B22",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 48000,
        precoVenda: 58900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, {
      nome: "Roberta Cobrança E2E",
      whatsapp: "(11) 98888-7777",
    });

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [
        {
          numero: 1,
          vencimento: diasAtras(40),
          valor: 1500,
          status: "Paga",
          valorPago: 1500,
          dataPagamento: diasAtras(40),
        },
        { numero: 2, vencimento: diasAtras(10), valor: 1500 },
        { numero: 3, vencimento: diasAFrente(20), valor: 1500 },
      ],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");

    await expect(page.getByText("Roberta Cobrança E2E")).toBeVisible();
    await expect(page.getByText("R$ 1.500,00 pago")).toBeVisible();
    await expect(page.getByText("R$ 3.000,00 saldo")).toBeVisible();

    await page.getByRole("link", { name: "Situação dos clientes" }).click();
    await expect(page).toHaveURL(/mode=inadimplencia/);
    const linha = page.getByRole("row", { name: /Roberta Cobrança E2E/ });
    await expect(linha.getByText("Atrasado 1x")).toBeVisible();
    await expect(linha.getByText("R$ 3.000,00")).toBeVisible();

    const linkCobrar = linha.getByRole("link", { name: "Cobrar" });
    await expect(linkCobrar).toHaveAttribute("href", /^https:\/\/wa\.me\/5511988887777\?text=/);
    await expect(linkCobrar).toHaveAttribute("target", "_blank");
  });

  test("Situação dos clientes mostra Pago, A vencer e Atrasado 2x corretamente, e baixa o PDF", async ({
    page,
  }) => {
    const [veiculoPago, veiculoAVencer, veiculoAtrasado2x] = await seedVeiculos(tenantId, lojaId, [
      { tipo: "carro", placa: "SIT1A11", marca: "Fiat", modelo: "Mobi", valorCompra: 20000, precoVenda: 26000 },
      { tipo: "carro", placa: "SIT2B22", marca: "Fiat", modelo: "Uno", valorCompra: 18000, precoVenda: 23000 },
      { tipo: "carro", placa: "SIT3C33", marca: "Fiat", modelo: "Cronos", valorCompra: 22000, precoVenda: 29000 },
    ]);

    const clientePagoId = await seedCliente(tenantId, { nome: "Cliente Pago E2E" });
    await seedContratoCrediario(tenantId, {
      veiculoId: veiculoPago,
      vendedorId: gestorId,
      clienteId: clientePagoId,
      parcelas: [
        {
          numero: 1,
          vencimento: diasAtras(30),
          valor: 1000,
          status: "Paga",
          valorPago: 1000,
          dataPagamento: diasAtras(30),
        },
      ],
    });

    const clienteAVencerId = await seedCliente(tenantId, { nome: "Cliente A Vencer E2E" });
    await seedContratoCrediario(tenantId, {
      veiculoId: veiculoAVencer,
      vendedorId: gestorId,
      clienteId: clienteAVencerId,
      parcelas: [{ numero: 1, vencimento: diasAFrente(15), valor: 1200 }],
    });

    const clienteAtrasado2xId = await seedCliente(tenantId, {
      nome: "Cliente Atrasado 2x E2E",
      whatsapp: "(11) 97777-6666",
    });
    await seedContratoCrediario(tenantId, {
      veiculoId: veiculoAtrasado2x,
      vendedorId: gestorId,
      clienteId: clienteAtrasado2xId,
      parcelas: [
        { numero: 1, vencimento: diasAtras(60), valor: 900 },
        { numero: 2, vencimento: diasAtras(30), valor: 900 },
      ],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=inadimplencia");

    const linhaPago = page.getByRole("row", { name: /Cliente Pago E2E/ });
    await expect(linhaPago.getByText("Pago", { exact: true })).toBeVisible();
    await expect(linhaPago.getByText("R$ 0,00")).toBeVisible();
    await expect(linhaPago.getByRole("link", { name: "Cobrar" })).toHaveCount(0);

    const linhaAVencer = page.getByRole("row", { name: /Cliente A Vencer E2E/ });
    await expect(linhaAVencer.getByText("A vencer", { exact: true })).toBeVisible();
    await expect(linhaAVencer.getByText("R$ 1.200,00")).toBeVisible();
    await expect(linhaAVencer.getByRole("link", { name: "Cobrar" })).toHaveCount(0);

    const linhaAtrasado2x = page.getByRole("row", { name: /Cliente Atrasado 2x E2E/ });
    await expect(linhaAtrasado2x.getByText("Atrasado 2x", { exact: true })).toBeVisible();
    await expect(linhaAtrasado2x.getByText("R$ 1.800,00")).toBeVisible();
    await expect(linhaAtrasado2x.getByRole("link", { name: "Cobrar" })).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF" }).click();
    expect((await download).suggestedFilename()).toMatch(/^situacao-clientes-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  test("Contas a receber abre por padrão na visão por parcela, já pronta para seleção", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB6F66",
        marca: "Yamaha",
        modelo: "Factor 150",
        valorCompra: 10000,
        precoVenda: 13900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Padrao Parcela E2E" });
    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento: diasAtras(5), valor: 700 }],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber");

    await expect(page).not.toHaveURL(/mode=/);
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Selecionar todas as parcelas" })).toBeVisible();
  });

  test("na visão por contrato o card mostra e permite baixar a próxima parcela com juros", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB3C33",
        marca: "Yamaha",
        modelo: "Fazer 250",
        valorCompra: 12000,
        precoVenda: 16990,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Carlos Padrão E2E" });
    const vencimento = diasAtras(15);

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento, valor: 800 }],
    });

    const diasAtrasoEsperado = calcularDiasAtraso(vencimento, new Date());
    const jurosEsperado = calcularJurosMulta(800, diasAtrasoEsperado, 2, 0.1);
    const valorComJurosEsperado = 800 + jurosEsperado;

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");
    await expect(page.getByRole("table")).toHaveCount(0);

    const gatilhoCard = page.getByRole("button", { name: /Carlos Padrão E2E/ });
    await expect(gatilhoCard.getByText(formatBRL(valorComJurosEsperado))).toBeVisible();
    await gatilhoCard.click();

    await expect(page.getByText(/Carlos Padrão E2E — Yamaha Fazer 250/)).toBeVisible();
    await expect(page.getByText(formatBRL(valorComJurosEsperado)).last()).toBeVisible();

    await page.getByRole("button", { name: "Dar baixa" }).click();
    await expect(page.getByText(formatBRL(jurosEsperado))).toBeVisible();
    await page.getByRole("button", { name: "Confirmar recebimento" }).click();
    await expect(page.getByRole("button", { name: "Confirmar recebimento" })).not.toBeVisible();
    // A parcela baixada continua listada no carnê (agora como "Paga"), só
    // perde o botão de baixa — o card mostra o contrato inteiro, não só o
    // que está em aberto.
    await expect(page.getByText("1 parcela · 1 paga · carnê quitado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Dar baixa" })).toHaveCount(0);

    const admin = createTestAdminClient();
    const { data: parcela } = await admin
      .from("parcelas")
      .select("status, valor_pago")
      .eq("id", parcelas[0].id)
      .single();
    expect(parcela?.status).toBe("Paga");
    expect(parcela?.valor_pago).toBe(valorComJurosEsperado);
  });

  test("gestor seleciona parcelas dentro do card do contrato e baixa todas de uma vez", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB7G77",
        marca: "Volkswagen",
        modelo: "Gol",
        valorCompra: 30000,
        precoVenda: 38900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Contrato Lote E2E" });
    const vencimentos = [diasAtras(45), diasAtras(15), diasAFrente(15)];

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: vencimentos.map((vencimento, i) => ({
        numero: i + 1,
        vencimento,
        valor: 600,
      })),
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");

    await page.getByRole("button", { name: /Contrato Lote E2E/ }).click();
    const dialogContrato = page.getByRole("dialog");

    await dialogContrato
      .getByRole("checkbox", { name: "Selecionar todas as parcelas do contrato" })
      .click();
    await expect(dialogContrato.getByText("3 parcelas selecionadas")).toBeVisible();

    await dialogContrato.getByRole("button", { name: "Dar baixa em lote" }).click();
    await page.getByRole("button", { name: "Confirmar 3 recebimentos" }).click();

    // Esperar o carnê ficar quitado (e não só o botão sumir: ele vira
    // "Confirmando…" antes da action terminar, o que deixaria a consulta ao
    // banco correr com a baixa ainda em voo). As 3 parcelas continuam
    // listadas, agora como pagas.
    await expect(page.getByText("3 parcelas · 3 pagas · carnê quitado")).toBeVisible();

    const admin = createTestAdminClient();
    const { data: baixadas } = await admin
      .from("parcelas")
      .select("status")
      .in("id", parcelas.map((p) => p.id));

    expect(baixadas).toHaveLength(3);
    expect((baixadas ?? []).every((p) => p.status === "Paga")).toBe(true);
  });

  test("gestor seleciona várias parcelas e dá baixa em lote com uma forma de pagamento", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB4D44",
        marca: "Chevrolet",
        modelo: "Onix",
        valorCompra: 42000,
        precoVenda: 52900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Lote Cliente E2E" });
    const vencimentos = [diasAtras(60), diasAtras(30), diasAtras(10)];

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: vencimentos.map((vencimento, i) => ({
        numero: i + 1,
        vencimento,
        valor: 500,
      })),
    });

    const hoje = new Date();
    const valoresEsperados = vencimentos.map(
      (v) => 500 + calcularJurosMulta(500, calcularDiasAtraso(v, hoje), 2, 0.1),
    );
    const totalEsperado = valoresEsperados.reduce((soma, v) => soma + v, 0);

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    await page.getByRole("checkbox", { name: "Selecionar todas as parcelas" }).click();
    await expect(page.getByText("3 parcelas selecionadas")).toBeVisible();
    await expect(page.getByText(formatBRL(totalEsperado)).first()).toBeVisible();

    await page.getByRole("button", { name: "Dar baixa em lote" }).click();
    await page.getByLabel("Forma de pagamento").selectOption("dinheiro");
    await page.getByRole("button", { name: "Confirmar 3 recebimentos" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const admin = createTestAdminClient();
    const { data: baixadas } = await admin
      .from("parcelas")
      .select("numero, status, valor_pago, forma_pagamento")
      .in("id", parcelas.map((p) => p.id))
      .order("numero");

    expect(baixadas).toHaveLength(3);
    for (const [i, parcela] of (baixadas ?? []).entries()) {
      expect(parcela.status).toBe("Paga");
      expect(parcela.valor_pago).toBeCloseTo(valoresEsperados[i], 2);
      expect(parcela.forma_pagamento).toBe("dinheiro");
    }
  });

  test("parcela já paga não é selecionável para baixa em lote", async ({ page }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB5E55",
        marca: "Honda",
        modelo: "Biz 125",
        valorCompra: 9000,
        precoVenda: 12900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Mista Cliente E2E" });

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [
        { numero: 1, vencimento: diasAtras(40), valor: 400, status: "Paga", valorPago: 400 },
        { numero: 2, vencimento: diasAtras(10), valor: 400 },
      ],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    // Só a parcela 2 (em aberto) ganha checkbox; o cabeçalho é o outro checkbox.
    await expect(page.getByRole("checkbox")).toHaveCount(2);

    await page.getByRole("checkbox", { name: "Selecionar todas as parcelas" }).click();
    await expect(page.getByText("1 parcela selecionada")).toBeVisible();
  });

  test("desconto em formato brasileiro (1.500,00) é aplicado como 1500, não como zero", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB7G77",
        marca: "Volkswagen",
        modelo: "Gol",
        valorCompra: 28000,
        precoVenda: 35900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Desconto Cliente E2E" });

    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento: diasAFrente(10), valor: 5000 }],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    const linha = page.getByRole("row", { name: /Desconto Cliente E2E/ });
    await linha.getByRole("button", { name: "Dar baixa" }).click();

    // Antes da correção o parse era Number("1.500,00".replace(",", ".")) → NaN
    // → 0: a baixa era gravada pelo valor cheio, sem desconto e sem erro.
    await page.getByLabel("Desconto (R$)").fill("1.500,00");
    await expect(page.getByText(formatBRL(3500))).toBeVisible();

    await page.getByRole("button", { name: "Confirmar recebimento" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const admin = createTestAdminClient();
    const { data: parcela } = await admin
      .from("parcelas")
      .select("status, valor_pago, desconto_aplicado")
      .eq("id", parcelas[0].id)
      .single();
    expect(parcela?.status).toBe("Paga");
    expect(parcela?.desconto_aplicado).toBe(1500);
    expect(parcela?.valor_pago).toBe(3500);
  });

  test("desconto com texto inválido bloqueia o submit em vez de virar zero", async ({ page }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "moto",
        placa: "RCB8H88",
        marca: "Yamaha",
        modelo: "Fazer 250",
        valorCompra: 12000,
        precoVenda: 16900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Invalido Cliente E2E" });

    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento: diasAFrente(5), valor: 800 }],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    const linha = page.getByRole("row", { name: /Invalido Cliente E2E/ });
    await linha.getByRole("button", { name: "Dar baixa" }).click();

    await page.getByLabel("Desconto (R$)").fill("abc");
    await expect(page.getByText("Use apenas números (ex.: 1.500,00).")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirmar recebimento" })).toBeDisabled();
  });

  test("vendedor consulta contas a receber mas não tem ação de baixa", async ({ page }) => {
    const vendedorEmail = uniqueEmail("receber-vendedor");
    const vendedorId = await createConfirmedUser(vendedorEmail, SENHA);
    await adicionarMembro({
      userId: vendedorId,
      tenantId,
      lojaId,
      nome: "Vendedor Receber E2E",
      role: "vendedor",
    });

    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB9I99",
        marca: "Fiat",
        modelo: "Argo",
        valorCompra: 40000,
        precoVenda: 49900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Vendedor Ve E2E" });
    await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId,
      clienteId,
      parcelas: [{ numero: 1, vencimento: diasAtras(15), valor: 900 }],
    });

    await logar(page, vendedorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    // A tela continua acessível de propósito — o vendedor precisa consultar a
    // situação do cliente dele. O que sai são as ações que mexem em caixa.
    await expect(page.getByRole("cell", { name: "Vendedor Ve E2E" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dar baixa" })).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: /Selecionar/ })).toHaveCount(0);

    await deleteUserByEmail(vendedorEmail).catch(() => {});
  });

  test("card do contrato mostra o carnê inteiro, incluindo as parcelas já pagas", async ({
    page,
  }) => {
    const [veiculoId] = await seedVeiculos(tenantId, lojaId, [
      {
        tipo: "carro",
        placa: "RCB1J11",
        marca: "Renault",
        modelo: "Kwid",
        valorCompra: 33000,
        precoVenda: 41900,
      },
    ]);
    const clienteId = await seedCliente(tenantId, { nome: "Carne Completo E2E" });

    // 6 parcelas: 2 já vencidas (que o cliente vai baixar) e 4 futuras. Antes
    // desta mudança o card listava só as não pagas — o cliente da revenda
    // reclamou de "24 parcelas e só aparecem 3".
    const { parcelas } = await seedContratoCrediario(tenantId, {
      veiculoId,
      vendedorId: gestorId,
      clienteId,
      parcelas: [
        { numero: 1, vencimento: diasAtras(60), valor: 500 },
        { numero: 2, vencimento: diasAtras(30), valor: 500 },
        { numero: 3, vencimento: diasAFrente(30), valor: 500 },
        { numero: 4, vencimento: diasAFrente(60), valor: 500 },
        { numero: 5, vencimento: diasAFrente(90), valor: 500 },
        { numero: 6, vencimento: diasAFrente(120), valor: 500 },
      ],
    });

    // Marca as 2 primeiras como pagas direto no banco, simulando carnê em curso.
    const admin = createTestAdminClient();
    await admin
      .from("parcelas")
      .update({ status: "Paga", valor_pago: 500, data_pagamento: diasAtras(1) })
      .in("id", [parcelas[0].id, parcelas[1].id]);

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=contrato");

    await page.getByRole("button", { name: /Carne Completo E2E/ }).click();
    const dialog = page.getByRole("dialog");

    // O resumo declara o carnê inteiro, não só o que está em aberto.
    await expect(dialog.getByText("6 parcelas · 2 pagas · 4 em aberto")).toBeVisible();

    // E as 6 linhas estão lá, incluindo as duas quitadas.
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await expect(dialog.getByText(`Parcela ${n}/6`, { exact: false })).toBeVisible();
    }

    // Só as 4 em aberto oferecem baixa.
    await expect(dialog.getByRole("button", { name: "Dar baixa" })).toHaveCount(4);
  });

  test("busca por cliente e filtros dividem a lista de parcelas", async ({ page }) => {
    const [motoId, carroId] = await seedVeiculos(tenantId, lojaId, [
      { tipo: "moto", placa: "RCB2K22", marca: "Honda", modelo: "Titan 160", valorCompra: 9000, precoVenda: 13900 },
      { tipo: "carro", placa: "RCB3L33", marca: "Fiat", modelo: "Uno", valorCompra: 20000, precoVenda: 26900 },
    ]);
    const anaId = await seedCliente(tenantId, { nome: "Ana Búsca E2E" });
    const brunoId = await seedCliente(tenantId, { nome: "Bruno Filtro E2E" });

    // Ana: 1 atrasada há ~100 dias e 1 futura. Bruno: 1 atrasada há ~10 dias.
    await seedContratoCrediario(tenantId, {
      veiculoId: motoId,
      vendedorId: gestorId,
      clienteId: anaId,
      parcelas: [
        { numero: 1, vencimento: diasAtras(100), valor: 300 },
        { numero: 2, vencimento: diasAFrente(45), valor: 300 },
      ],
    });
    await seedContratoCrediario(tenantId, {
      veiculoId: carroId,
      vendedorId: gestorId,
      clienteId: brunoId,
      parcelas: [{ numero: 1, vencimento: diasAtras(10), valor: 700 }],
    });

    await logar(page, gestorEmail);
    await page.goto("/financeiro/receber?mode=parcela");

    const busca = page.getByLabel("Buscar cliente ou veículo");
    const linhaAna = page.getByRole("row", { name: /Ana Búsca E2E/ });
    const linhaBruno = page.getByRole("row", { name: /Bruno Filtro E2E/ });

    // Sem filtro, os dois aparecem.
    await expect(linhaAna.first()).toBeVisible();
    await expect(linhaBruno).toBeVisible();

    // Busca por nome, sem acento e em caixa baixa.
    await busca.fill("ana busca");
    await expect(linhaAna.first()).toBeVisible();
    await expect(linhaBruno).toHaveCount(0);
    await expect(page.getByText("2 de 3 parcelas")).toBeVisible();

    // Busca também casa com o veículo.
    await busca.fill("uno");
    await expect(linhaBruno).toBeVisible();
    await expect(linhaAna).toHaveCount(0);

    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(linhaAna.first()).toBeVisible();
    await expect(linhaBruno).toBeVisible();

    // Faixa de atraso separa quem está atrasado há muito de quem atrasou pouco.
    await page.getByLabel("Faixa de atraso").selectOption("90+");
    await expect(linhaAna.first()).toBeVisible();
    await expect(linhaBruno).toHaveCount(0);

    await page.getByLabel("Faixa de atraso").selectOption("1-30");
    await expect(linhaBruno).toBeVisible();
    await expect(linhaAna).toHaveCount(0);

    await page.getByRole("button", { name: "Limpar filtros" }).click();

    // Vencimento separa o que já venceu do que ainda vai vencer.
    await page.getByLabel("Vencimento").selectOption("futuras");
    await expect(page.getByText("1 de 3 parcelas")).toBeVisible();
    await expect(linhaBruno).toHaveCount(0);
  });
});
