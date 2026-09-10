import { createClient } from "@/lib/supabase/server";
import { selecionarTudo } from "./paginacao";
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

  // Tudo aqui é somado para virar dinheiro na tela: uma leitura truncada em
  // 1000 linhas não dá erro, só mostra um fluxo de caixa menor do que o real.
  // Por isso toda consulta desta função é paginada.
  const [parcelasPagas, vendas, contasPagas, custos] = await Promise.all([
    selecionarTudo((de, ate) =>
      supabase
        .from("parcelas")
        .select("valor_pago, data_pagamento")
        .eq("status", "Paga")
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", inicioJanela)
        .order("id")
        .range(de, ate),
    ).catch((e: Error) => {
      throw new Error(`Falha ao listar parcelas pagas: ${e.message}`);
    }),
    selecionarTudo((de, ate) =>
      supabase
        .from("vendas")
        .select("id, data_venda")
        .eq("status", "confirmada")
        .gte("data_venda", inicioJanela)
        .order("id")
        .range(de, ate),
    ).catch((e: Error) => {
      throw new Error(`Falha ao listar vendas: ${e.message}`);
    }),
    selecionarTudo((de, ate) =>
      supabase
        .from("contas_pagar")
        .select("valor_pago, data_pagamento")
        .eq("status", "Paga")
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", inicioJanela)
        .order("id")
        .range(de, ate),
    ).catch((e: Error) => {
      throw new Error(`Falha ao listar contas a pagar: ${e.message}`);
    }),
    selecionarTudo((de, ate) =>
      supabase.from("custos_veiculo").select("valor, data").gte("data", inicioJanela).order("id").range(de, ate),
    ).catch((e: Error) => {
      throw new Error(`Falha ao listar custos de veículo: ${e.message}`);
    }),
  ]);

  const vendaIds = vendas.map((v) => v.id);
  const vendaDataPorId = new Map(vendas.map((v) => [v.id, v.data_venda]));

  const pagamentos = vendaIds.length
    ? await selecionarTudo((de, ate) =>
        supabase
          .from("venda_pagamentos")
          .select("venda_id, tipo, valor")
          .in("venda_id", vendaIds)
          .order("id")
          .range(de, ate),
      ).catch((e: Error) => {
        throw new Error(`Falha ao listar pagamentos de venda: ${e.message}`);
      })
    : [];

  const entradasParcelas = parcelasPagas.map((p) => ({
    data: p.data_pagamento!,
    valor: p.valor_pago,
  }));
  const entradasAVista = pagamentos
    .filter((p) => p.tipo !== "crediario" && p.tipo !== "troca")
    .map((p) => ({ data: vendaDataPorId.get(p.venda_id)!, valor: p.valor }));

  const saidasContasPagar = contasPagas.map((c) => ({
    data: c.data_pagamento!,
    valor: c.valor_pago,
  }));
  const saidasCustos = custos.map((c) => ({ data: c.data, valor: c.valor }));

  return agruparFluxoCaixaPorMes(
    [...entradasParcelas, ...entradasAVista],
    [...saidasContasPagar, ...saidasCustos],
    hoje,
    meses,
  );
}
