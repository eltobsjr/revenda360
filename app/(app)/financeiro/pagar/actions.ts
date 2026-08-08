"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dataIsoLocal } from "@/lib/domain/datas";
import { contaPagarFormSchema, baixaContaPagarSchema } from "@/lib/validation/conta-pagar.schema";

export type ContaPagarState = {
  error: string | null;
  sucesso: boolean;
};

export async function criarContaPagar(
  _prevState: ContaPagarState,
  formData: FormData,
): Promise<ContaPagarState> {
  const profile = await requireRole(["gestor", "financeiro"]);

  const parsed = contaPagarFormSchema.safeParse({
    descricao: String(formData.get("descricao") ?? ""),
    categoria: String(formData.get("categoria") ?? ""),
    fornecedor: String(formData.get("fornecedor") ?? ""),
    valor: Number(String(formData.get("valor") ?? "0").replace(",", ".")) || 0,
    vencimento: String(formData.get("vencimento") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contas_pagar").insert({
    tenant_id: profile.tenantId,
    descricao: parsed.data.descricao,
    categoria: parsed.data.categoria || null,
    fornecedor: parsed.data.fornecedor || null,
    valor: parsed.data.valor,
    vencimento: parsed.data.vencimento,
  });

  if (error) {
    return { error: "Não foi possível cadastrar a conta a pagar.", sucesso: false };
  }

  revalidatePath("/financeiro/pagar");
  return { error: null, sucesso: true };
}

export async function darBaixaContaPagar(
  _prevState: ContaPagarState,
  formData: FormData,
): Promise<ContaPagarState> {
  const profile = await requireRole(["gestor", "financeiro"]);

  const parsed = baixaContaPagarSchema.safeParse({
    contaPagarId: String(formData.get("contaPagarId") ?? ""),
    formaPagamento: String(formData.get("formaPagamento") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }
  const { contaPagarId, formaPagamento } = parsed.data;

  const supabase = await createClient();
  const { data: conta, error: contaError } = await supabase
    .from("contas_pagar")
    .select("id, valor, status")
    .eq("id", contaPagarId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();
  if (contaError) {
    return { error: "Não foi possível carregar a conta. " + contaError.message, sucesso: false };
  }
  if (!conta) return { error: "Conta não encontrada.", sucesso: false };
  if (conta.status === "Paga") return { error: "Esta conta já foi paga.", sucesso: false };

  // Mesma trava contra baixa dupla usada em Contas a receber: sem o `select`
  // no update com `neq`, um segundo clique simultâneo voltaria "sucesso" sem
  // ter alterado nada.
  const { data: atualizadas, error: updateError } = await supabase
    .from("contas_pagar")
    .update({
      status: "Paga",
      valor_pago: conta.valor,
      data_pagamento: dataIsoLocal(new Date()),
      forma_pagamento: formaPagamento,
    })
    .eq("id", contaPagarId)
    .eq("tenant_id", profile.tenantId)
    .neq("status", "Paga")
    .select("id");
  if (updateError) {
    return { error: "Não foi possível confirmar o pagamento. " + updateError.message, sucesso: false };
  }
  if (!atualizadas || atualizadas.length === 0) {
    return { error: "Esta conta já foi paga.", sucesso: false };
  }

  revalidatePath("/financeiro/pagar");
  return { error: null, sucesso: true };
}
