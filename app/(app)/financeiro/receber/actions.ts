"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { getTenantConfig } from "@/lib/data/tenant";
import { createClient } from "@/lib/supabase/server";
import { calcularDiasAtraso, calcularJurosMulta } from "@/lib/domain/juros";
import { dataIsoLocal } from "@/lib/domain/datas";
import { baixaParcelaSchema } from "@/lib/validation/baixa-parcela.schema";
import { renegociarContratoSchema } from "@/lib/validation/renegociacao.schema";

export type BaixaParcelaState = {
  error: string | null;
  sucesso: boolean;
};

export type RenegociarContratoResultado = {
  novoContratoId: string | null;
  error: string | null;
};

export async function renegociarContrato(input: unknown): Promise<RenegociarContratoResultado> {
  await requireProfile();

  const parsed = renegociarContratoSchema.safeParse(input);
  if (!parsed.success) {
    return { novoContratoId: null, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("renegociar_contrato", {
    payload: parsed.data,
  });

  if (error) {
    return { novoContratoId: null, error: "Não foi possível renegociar o contrato. " + error.message };
  }

  revalidatePath("/financeiro/receber");
  return { novoContratoId: data, error: null };
}

export async function darBaixaParcela(
  _prevState: BaixaParcelaState,
  formData: FormData,
): Promise<BaixaParcelaState> {
  const profile = await requireProfile();

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
    .eq("tenant_id", profile.tenantId)
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
  if (parcela.status === "Renegociada") {
    return { error: "Esta parcela foi renegociada e não representa mais dívida em aberto.", sucesso: false };
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
  // Sem isso, um desconto digitado maior que a própria dívida zerava o
  // valor a receber mas gravava `desconto_aplicado` com o número exagerado
  // (ex.: 10000 numa parcela de 500) — a prévia na tela já mostra "R$ 0,00"
  // pro usuário, mas nada impedia o submit nem corrigia o valor persistido.
  const descontoEfetivo = Math.min(desconto, parcela.valor + juros);
  const valorPago = Math.max(0, parcela.valor + juros - descontoEfetivo);

  // O `neq` é a trava contra duas baixas simultâneas da mesma parcela (dois
  // cliques, duas abas): quem chegar depois não atualiza linha nenhuma. Sem o
  // `select`, esse caso voltaria como sucesso sem ter gravado nada.
  const { data: atualizadas, error: updateError } = await supabase
    .from("parcelas")
    .update({
      status: "Paga",
      valor_pago: valorPago,
      data_pagamento: dataIsoLocal(hoje),
      desconto_aplicado: descontoEfetivo,
      juros_multa_aplicado: juros,
      forma_pagamento: formaPagamento,
    })
    .eq("id", parcelaId)
    .eq("tenant_id", profile.tenantId)
    .neq("status", "Paga")
    .select("id");
  if (updateError) {
    return {
      error: "Não foi possível confirmar o recebimento. " + updateError.message,
      sucesso: false,
    };
  }
  if (!atualizadas || atualizadas.length === 0) {
    return { error: "Esta parcela já foi baixada.", sucesso: false };
  }

  revalidatePath("/financeiro/receber");
  return { error: null, sucesso: true };
}
