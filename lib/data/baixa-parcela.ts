import type { createClient } from "@/lib/supabase/server";
import { calcularDiasAtraso, calcularJurosMulta, type StatusParcela } from "@/lib/domain/juros";
import { dataIsoLocal } from "@/lib/domain/datas";
import type { FORMAS_PAGAMENTO_BAIXA } from "@/lib/validation/baixa-parcela.schema";

export type FormaPagamentoBaixa = (typeof FORMAS_PAGAMENTO_BAIXA)[number];

/** Client autenticado como o usuário da requisição (respeita RLS). */
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Campos da parcela necessários para calcular e gravar a baixa. */
export type ParcelaParaBaixa = {
  id: string;
  vencimento: string;
  valor: number;
  status: StatusParcela;
};

export type TenantConfigJuros = {
  multa_pct: number;
  mora_pct_dia: number;
};

/**
 * Por que uma parcela não pode receber baixa — `null` quando pode.
 * Separado da gravação para que a baixa individual e a baixa em lote recusem
 * exatamente os mesmos casos, com exatamente a mesma mensagem.
 */
function motivoNaoBaixavel(status: string): string | null {
  if (status === "Paga") return "Esta parcela já foi baixada.";
  if (status === "Renegociada") {
    return "Esta parcela foi renegociada e não representa mais dívida em aberto.";
  }
  return null;
}

/**
 * Grava a baixa de UMA parcela: recalcula juros/multa no servidor, limita o
 * desconto ao total devido e atualiza a linha.
 *
 * Núcleo compartilhado entre `darBaixaParcela` e `darBaixaParcelasEmLote` —
 * o valor pago nunca vem do client, é sempre recalculado aqui a partir do
 * valor e do vencimento gravados no banco.
 *
 * Retorna a mensagem de erro, ou `null` em caso de sucesso.
 */
export async function aplicarBaixaParcela(
  supabase: ServerSupabase,
  params: {
    tenantId: string;
    tenantConfig: TenantConfigJuros;
    parcela: ParcelaParaBaixa;
    desconto: number;
    formaPagamento: FormaPagamentoBaixa;
    hoje: Date;
  },
): Promise<string | null> {
  const { tenantId, tenantConfig, parcela, desconto, formaPagamento, hoje } = params;

  const impedimento = motivoNaoBaixavel(parcela.status);
  if (impedimento) return impedimento;

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
  const { data: atualizadas, error } = await supabase
    .from("parcelas")
    .update({
      status: "Paga",
      valor_pago: valorPago,
      data_pagamento: dataIsoLocal(hoje),
      desconto_aplicado: descontoEfetivo,
      juros_multa_aplicado: juros,
      forma_pagamento: formaPagamento,
    })
    .eq("id", parcela.id)
    .eq("tenant_id", tenantId)
    .neq("status", "Paga")
    .select("id");

  if (error) return "Não foi possível confirmar o recebimento. " + error.message;
  if (!atualizadas || atualizadas.length === 0) return "Esta parcela já foi baixada.";
  return null;
}
