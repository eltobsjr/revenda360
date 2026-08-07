import { createClient } from "@/lib/supabase/server";
import { statusEfetivo, calcularDiasAtraso, type StatusParcela } from "@/lib/domain/juros";

export type ContaPagarRow = {
  id: string;
  descricao: string;
  categoria: string | null;
  fornecedor: string | null;
  valor: number;
  vencimento: string;
  status: StatusParcela;
  valorPago: number;
  dataPagamento: string | null;
  diasAtraso: number;
  podeBaixar: boolean;
};

/** Todas as contas a pagar do tenant, com status efetivo calculado — mesmo critério de `listParcelas` (Contas a receber). */
export async function listContasPagar(filtroStatus?: StatusParcela): Promise<ContaPagarRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas_pagar")
    .select("id, descricao, categoria, fornecedor, valor, vencimento, status, valor_pago, data_pagamento")
    .order("vencimento");
  if (error) throw new Error(`Falha ao listar contas a pagar: ${error.message}`);

  const hoje = new Date();
  const linhas: ContaPagarRow[] = (data ?? []).map((c) => {
    const status = statusEfetivo(c.status, c.vencimento, hoje);
    return {
      id: c.id,
      descricao: c.descricao,
      categoria: c.categoria,
      fornecedor: c.fornecedor,
      valor: c.valor,
      vencimento: c.vencimento,
      status,
      valorPago: c.valor_pago,
      dataPagamento: c.data_pagamento,
      diasAtraso: status === "Atrasada" ? calcularDiasAtraso(c.vencimento, hoje) : 0,
      podeBaixar: status !== "Paga",
    };
  });

  return filtroStatus ? linhas.filter((l) => l.status === filtroStatus) : linhas;
}
