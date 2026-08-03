import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client com privilégios totais para uso exclusivo dos testes E2E: confirmar
 * e-mail sem depender de caixa de entrada real, e limpar dados de teste ao
 * final de cada teste (nunca usado pelo app em produção).
 */
export function createTestAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

export function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e.${prefix}.${stamp}@example.com`;
}

/**
 * Cria o usuário já confirmado direto via Admin API — ao contrário de
 * `supabase.auth.signUp()`, isto NÃO envia e-mail nenhum, então não consome a
 * cota de rate limit de envio de e-mail do projeto (baixíssima no plano
 * gratuito). Use isto para preparar o "usuário de teste" nos testes que não
 * são especificamente sobre o formulário de cadastro/confirmação em si.
 */
export async function createConfirmedUser(email: string, password: string) {
  const admin = createTestAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário de teste ${email}: ${error?.message}`);
  }
  return data.user.id;
}

/**
 * Provisiona um tenant completo (tenant + tenant_config + loja + profile
 * gestor) para um usuário já criado — o mesmo trabalho que o painel
 * administrativo (futuro) fará ao cadastrar uma revenda nova. Não existe mais
 * fluxo de autocadastro/onboarding no app: quem cria a revenda é o dono da
 * plataforma, e o cliente só faz login com a senha temporária recebida.
 * Usa o client com service role, que ignora RLS, espelhando exatamente o que
 * o painel administrativo vai fazer.
 */
export async function createTenantWithGestor({
  userId,
  nomeRevenda,
  nomeGestor,
  nomeLoja,
}: {
  userId: string;
  nomeRevenda: string;
  nomeGestor: string;
  nomeLoja: string;
}) {
  const admin = createTestAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({ nome: nomeRevenda })
    .select("id")
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Falha ao criar tenant de teste: ${tenantError?.message}`);
  }

  const { error: configError } = await admin
    .from("tenant_config")
    .insert({ tenant_id: tenant.id });
  if (configError) {
    throw new Error(`Falha ao criar tenant_config de teste: ${configError.message}`);
  }

  const { data: loja, error: lojaError } = await admin
    .from("lojas")
    .insert({ tenant_id: tenant.id, nome: nomeLoja })
    .select("id")
    .single();
  if (lojaError || !loja) {
    throw new Error(`Falha ao criar loja de teste: ${lojaError?.message}`);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    tenant_id: tenant.id,
    loja_id: loja.id,
    nome: nomeGestor,
    role: "gestor",
  });
  if (profileError) {
    throw new Error(`Falha ao criar profile gestor de teste: ${profileError.message}`);
  }

  return { tenantId: tenant.id, lojaId: loja.id };
}

/** Vincula um usuário já criado como membro (vendedor/financeiro) de um tenant já existente. */
export async function adicionarMembro({
  userId,
  tenantId,
  lojaId,
  nome,
  role,
}: {
  userId: string;
  tenantId: string;
  lojaId: string;
  nome: string;
  role: "vendedor" | "financeiro";
}) {
  const admin = createTestAdminClient();
  const { error } = await admin
    .from("profiles")
    .insert({ id: userId, tenant_id: tenantId, loja_id: lojaId, nome, role });
  if (error) {
    throw new Error(`Falha ao vincular membro de teste: ${error.message}`);
  }
}

type VeiculoSeed = {
  tipo: "carro" | "moto";
  placa: string;
  marca: string;
  modelo: string;
  valorCompra: number;
  precoVenda: number;
  status?:
    | "Disponível"
    | "Em preparação"
    | "Reservado"
    | "Vendido"
    | "Consignado"
    | "Repasse"
    | "Devolvido";
  dataEntrada?: string;
  custo?: number;
};

/** Insere alguns veículos (+ custo lançado opcional) direto no tenant, para testar Estoque/Ficha sem depender da tela de Entrada de veículo (Fase 2, ainda não construída). */
export async function seedVeiculos(
  tenantId: string,
  lojaId: string,
  veiculos: VeiculoSeed[],
) {
  const admin = createTestAdminClient();
  const ids: string[] = [];

  for (const v of veiculos) {
    const { data, error } = await admin
      .from("veiculos")
      .insert({
        tenant_id: tenantId,
        loja_id: lojaId,
        tipo: v.tipo,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        valor_compra: v.valorCompra,
        preco_venda: v.precoVenda,
        status: v.status ?? "Disponível",
        data_entrada: v.dataEntrada ?? new Date().toISOString().slice(0, 10),
        especificacoes:
          v.tipo === "carro"
            ? { cambio: "Manual", carroceria: "Hatch", portas: 4, opcionais: [] }
            : { cilindradaCc: 160, tipo: "Street", acessorios: [] },
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Falha ao inserir veículo de teste ${v.placa}: ${error?.message}`);
    }
    ids.push(data.id);

    if (v.custo) {
      await admin.from("custos_veiculo").insert({
        tenant_id: tenantId,
        veiculo_id: data.id,
        categoria: "Mecânica",
        valor: v.custo,
        data: v.dataEntrada ?? new Date().toISOString().slice(0, 10),
      });
    }
  }

  return ids;
}

/** Insere um cliente direto no tenant, para testar telas que dependem de um cliente já cadastrado (ex.: Nova venda). */
export async function seedCliente(
  tenantId: string,
  cliente: { nome: string; cpf?: string },
) {
  const admin = createTestAdminClient();
  const { data, error } = await admin
    .from("clientes")
    .insert({ tenant_id: tenantId, nome: cliente.nome, cpf: cliente.cpf ?? null })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao inserir cliente de teste ${cliente.nome}: ${error?.message}`);
  }
  return data.id;
}

/**
 * Insere direto uma venda + contrato de crediário + parcelas, para testar
 * Contas a receber (Fase 5) sem depender do wizard de Nova venda (Fase 4)
 * para controlar datas de vencimento no passado (parcelas em atraso).
 */
export async function seedContratoCrediario(
  tenantId: string,
  params: {
    veiculoId: string;
    vendedorId: string;
    clienteId?: string | null;
    clienteNomeAvulso?: string;
    parcelas: {
      numero: number;
      vencimento: string;
      valor: number;
      status?: "A vencer" | "Paga" | "Atrasada" | "Parcial" | "Renegociada";
      valorPago?: number;
      dataPagamento?: string;
    }[];
  },
) {
  const admin = createTestAdminClient();
  const valorTotal = params.parcelas.reduce((soma, p) => soma + p.valor, 0);

  const { data: venda, error: vendaError } = await admin
    .from("vendas")
    .insert({
      tenant_id: tenantId,
      veiculo_id: params.veiculoId,
      cliente_id: params.clienteId ?? null,
      cliente_nome_avulso: params.clienteNomeAvulso ?? null,
      vendedor_id: params.vendedorId,
      valor_venda: valorTotal,
      valor_final: valorTotal,
    })
    .select("id")
    .single();
  if (vendaError || !venda) {
    throw new Error(`Falha ao inserir venda de teste: ${vendaError?.message}`);
  }

  const { data: contrato, error: contratoError } = await admin
    .from("contratos_crediario")
    .insert({
      tenant_id: tenantId,
      venda_id: venda.id,
      cliente_id: params.clienteId ?? null,
      veiculo_id: params.veiculoId,
      valor_total: valorTotal,
      qtd_parcelas: params.parcelas.length,
      data_primeiro_vencimento: params.parcelas[0].vencimento,
    })
    .select("id")
    .single();
  if (contratoError || !contrato) {
    throw new Error(`Falha ao inserir contrato de crediário de teste: ${contratoError?.message}`);
  }

  const { data: parcelas, error: parcelasError } = await admin
    .from("parcelas")
    .insert(
      params.parcelas.map((p) => ({
        tenant_id: tenantId,
        contrato_id: contrato.id,
        numero: p.numero,
        vencimento: p.vencimento,
        valor: p.valor,
        status: p.status ?? "A vencer",
        valor_pago: p.valorPago ?? 0,
        data_pagamento: p.dataPagamento ?? null,
      })),
    )
    .select("id, numero");
  if (parcelasError) {
    throw new Error(`Falha ao inserir parcelas de teste: ${parcelasError.message}`);
  }

  return { vendaId: venda.id, contratoId: contrato.id, parcelas: parcelas ?? [] };
}

/** Remove o tenant (cascata cobre profiles/lojas/tenant_config) e os auth users criados no teste. */
export async function cleanupTenantByName(nomeRevenda: string) {
  const admin = createTestAdminClient();
  const { data: tenants } = await admin
    .from("tenants")
    .select("id")
    .eq("nome", nomeRevenda);

  for (const tenant of tenants ?? []) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .eq("tenant_id", tenant.id);

    await admin.from("tenants").delete().eq("id", tenant.id);

    for (const profile of profiles ?? []) {
      await admin.auth.admin.deleteUser(profile.id);
    }
  }
}

export async function deleteUserByEmail(email: string) {
  const admin = createTestAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
}
