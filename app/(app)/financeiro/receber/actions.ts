"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { getTenantConfig } from "@/lib/data/tenant";
import { createClient } from "@/lib/supabase/server";
import { calcularDiasAtraso, calcularJurosMulta } from "@/lib/domain/juros";
import { baixaParcelaSchema } from "@/lib/validation/baixa-parcela.schema";

export type BaixaParcelaState = {
  error: string | null;
  sucesso: boolean;
};

export async function darBaixaParcela(
  _prevState: BaixaParcelaState,
  formData: FormData,
): Promise<BaixaParcelaState> {
  await requireProfile();

  const parsed = baixaParcelaSchema.safeParse({
    parcelaId: String(formData.get("parcelaId") ?? ""),
    desconto: Number(String(formData.get("desconto") ?? "0").replace(",", ".")) || 0,
    formaPagamento: String(formData.get("formaPagamento") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }
  const { parcelaId, desconto, formaPagamento } = parsed.data;

  const supabase = await createClient();

  const { data: parcela, error: parcelaError } = await supabase
    .from("parcelas")
    .select("id, vencimento, valor, status")
    .eq("id", parcelaId)
    .maybeSingle();
  if (parcelaError) {
    return { error: "Não foi possível carregar a parcela. " + parcelaError.message, sucesso: false };
  }
  if (!parcela) {
    return { error: "Parcela não encontrada.", sucesso: false };
  }
  if (parcela.status === "Paga") {
    return { error: "Esta parcela já foi baixada.", sucesso: false };
  }

  const tenantConfig = await getTenantConfig();
  const hoje = new Date();
  const diasAtraso = calcularDiasAtraso(parcela.vencimento, hoje);
  const juros = calcularJurosMulta(
    parcela.valor,
    diasAtraso,
    tenantConfig.multa_pct,
    tenantConfig.mora_pct_dia,
  );
  const valorPago = Math.max(0, parcela.valor + juros - desconto);

  const { error: updateError } = await supabase
    .from("parcelas")
    .update({
      status: "Paga",
      valor_pago: valorPago,
      data_pagamento: hoje.toISOString().slice(0, 10),
      desconto_aplicado: desconto,
      juros_multa_aplicado: juros,
      forma_pagamento: formaPagamento,
    })
    .eq("id", parcelaId)
    .neq("status", "Paga");
  if (updateError) {
    return {
      error: "Não foi possível confirmar o recebimento. " + updateError.message,
      sucesso: false,
    };
  }

  revalidatePath("/financeiro/receber");
  return { error: null, sucesso: true };
}
