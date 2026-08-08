import { createClient } from "@/lib/supabase/server";
import { agruparFluxoCaixaPorMes, type MesFluxoCaixa } from "@/lib/domain/fluxo-caixa";
import type { UserRole } from "@/types/database.types";

/**
 * Entradas: parcelas de crediário pagas + pagamentos à vista (qualquer tipo
 * exceto "crediario" — já contado via parcela — e "troca" — não é dinheiro).
 * Saídas: contas a pagar pagas + custos de veículo lançados. Puramente
 * leitura agregada sobre tabelas que já existem (Fases 4, 5, 11) — sem
 * tabela nova. Dado financeiro interno: só gestor e financeiro (a tela já
 * redireciona vendedor; filtro replicado aqui como defesa em profundidade).
 */
export async function getFluxoCaixa(role: UserRole, meses = 12): Promise<MesFluxoCaixa[]> {
  if (role === "vendedor") return [];
  const supabase = await createClient();
  const hoje = new Date();
  const inicioJanela = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1)
    .toISOString()
    .slice(0, 10);

  const [parcelasRes, vendasRes, contasPagarRes, custosRes] = await Promise.all([
    supabase
      .from("parcelas")
      .select("valor_pago, data_pagamento")
      .eq("status", "Paga")
      .not("data_pagamento", "is", null)
      .gte("data_pagamento", inicioJanela),
    supabase
      .from("vendas")
      .select("id, data_venda")
      .eq("status", "confirmada")
      .gte("data_venda", inicioJanela),
    supabase
      .from("contas_pagar")
      .select("valor_pago, data_pagamento")
      .eq("status", "Paga")
      .not("data_pagamento", "is", null)
      .gte("data_pagamento", inicioJanela),
    supabase.from("custos_veiculo").select("valor, data").gte("data", inicioJanela),
  ]);

  if (parcelasRes.error) throw new Error(`Falha ao listar parcelas pagas: ${parcelasRes.error.message}`);
  if (vendasRes.error) throw new Error(`Falha ao listar vendas: ${vendasRes.error.message}`);
  if (contasPagarRes.error) throw new Error(`Falha ao listar contas a pagar: ${contasPagarRes.error.message}`);
  if (custosRes.error) throw new Error(`Falha ao listar custos de veículo: ${custosRes.error.message}`);

  const vendas = vendasRes.data ?? [];
  const vendaIds = vendas.map((v) => v.id);
  const vendaDataPorId = new Map(vendas.map((v) => [v.id, v.data_venda]));

  const pagamentosRes = vendaIds.length
    ? await supabase.from("venda_pagamentos").select("venda_id, tipo, valor").in("venda_id", vendaIds)
    : { data: [] as { venda_id: string; tipo: string; valor: number }[], error: null };
  if (pagamentosRes.error) throw new Error(`Falha ao listar pagamentos de venda: ${pagamentosRes.error.message}`);

  const entradasParcelas = (parcelasRes.data ?? []).map((p) => ({
    data: p.data_pagamento!,
    valor: p.valor_pago,
  }));
  const entradasAVista = (pagamentosRes.data ?? [])
    .filter((p) => p.tipo !== "crediario" && p.tipo !== "troca")
    .map((p) => ({ data: vendaDataPorId.get(p.venda_id)!, valor: p.valor }));

  const saidasContasPagar = (contasPagarRes.data ?? []).map((c) => ({
    data: c.data_pagamento!,
    valor: c.valor_pago,
  }));
  const saidasCustos = (custosRes.data ?? []).map((c) => ({ data: c.data, valor: c.valor }));

  return agruparFluxoCaixaPorMes(
    [...entradasParcelas, ...entradasAVista],
    [...saidasContasPagar, ...saidasCustos],
    hoje,
    meses,
  );
}
