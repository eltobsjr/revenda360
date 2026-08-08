"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dataIsoLocal } from "@/lib/domain/datas";

export type MarcarComissaoPagaState = {
  error: string | null;
  sucesso: boolean;
};

export async function marcarComissaoPaga(
  _prevState: MarcarComissaoPagaState,
  formData: FormData,
): Promise<MarcarComissaoPagaState> {
  const profile = await requireRole(["gestor"]);

  const vendaId = String(formData.get("vendaId") ?? "");
  if (!vendaId) return { error: "Venda inválida.", sucesso: false };

  const supabase = await createClient();
  // Mesma trava contra duplo clique usada em Contas a receber/pagar: `neq`
  // no update com `select` garante que só a primeira baixa realmente grava.
  const { data: atualizadas, error } = await supabase
    .from("vendas")
    .update({ comissao_paga: true, comissao_data_pagamento: dataIsoLocal(new Date()) })
    .eq("id", vendaId)
    .eq("tenant_id", profile.tenantId)
    .eq("comissao_paga", false)
    .select("id");

  if (error) {
    return { error: "Não foi possível marcar a comissão como paga.", sucesso: false };
  }
  if (!atualizadas || atualizadas.length === 0) {
    return { error: "Esta comissão já estava marcada como paga.", sucesso: false };
  }

  revalidatePath("/financeiro/comissoes");
  return { error: null, sucesso: true };
}
