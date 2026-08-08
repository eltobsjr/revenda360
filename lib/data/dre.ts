import { createClient } from "@/lib/supabase/server";
import { custoTotal, margemPct as calcMargemPct } from "@/lib/domain/pricing";
import type { UserRole } from "@/types/database.types";

/**
 * DRE por veículo: mesma fórmula de lucro já usada no Dashboard
 * (`lucroVenda` em lib/data/dashboard.ts) — `margem = valor_final -
 * custoTotal(valor_compra, custos) - comissao_valor` — mas detalhada linha a
 * linha por venda em vez de agregada.
 */
export type DreLinha = {
  vendaId: string;
  veiculo: string;
  placa: string;
  dataVenda: string;
  precoVenda: number;
  custoAquisicao: number;
  custosLancados: number;
  comissao: number;
  /** Repasse ao consignante (Fase 15) — 0 pra veículo não consignado. */
  repasseConsignacao: number;
  margemR: number;
  margemPct: number;
};

/**
 * DRE completo (custo, comissão, margem) é 100% gestor — hoje a única tela
 * que chama isso já redireciona quem não é gestor, mas o filtro fica aqui
 * também (defesa em profundidade), pra qualquer chamador futuro não vazar
 * a informação financeira mais sensível do sistema por engano.
 */
export async function listDrePorVeiculo(
  dataInicial: string,
  dataFinal: string,
  role: UserRole,
): Promise<DreLinha[]> {
  if (role !== "gestor") return [];
  const supabase = await createClient();
  const { data: vendas, error } = await supabase
    .from("vendas")
    .select("id, veiculo_id, data_venda, valor_final, comissao_valor")
    .eq("status", "confirmada")
    .gte("data_venda", dataInicial)
    .lte("data_venda", dataFinal)
    .order("data_venda", { ascending: false });
  if (error) throw new Error(`Falha ao listar vendas para o DRE: ${error.message}`);
  if (!vendas || vendas.length === 0) return [];

  const veiculoIds = [...new Set(vendas.map((v) => v.veiculo_id))];
  const [veiculosRes, custosRes, consignacoesRes] = await Promise.all([
    supabase.from("veiculos").select("id, marca, modelo, placa, valor_compra").in("id", veiculoIds),
    supabase.from("custos_veiculo").select("veiculo_id, valor").in("veiculo_id", veiculoIds),
    supabase.from("consignacoes").select("veiculo_id, valor_repasse").in("veiculo_id", veiculoIds),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos: ${veiculosRes.error.message}`);
  if (custosRes.error) throw new Error(`Falha ao resolver custos de veículo: ${custosRes.error.message}`);
  // `consignacoes` é tabela nova (migration 0011) — trata erro (ex.: quem
  // ainda não aplicou a migration) como "nenhum consignado" em vez de
  // quebrar o DRE inteiro, que já funciona sem Consignados.
  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, v]));
  const repassePorVeiculo = new Map(
    (consignacoesRes.error ? [] : (consignacoesRes.data ?? [])).map((c) => [
      c.veiculo_id,
      c.valor_repasse,
    ]),
  );
  const custosPorVeiculo = new Map<string, number[]>();
  for (const c of custosRes.data ?? []) {
    const lista = custosPorVeiculo.get(c.veiculo_id) ?? [];
    lista.push(c.valor);
    custosPorVeiculo.set(c.veiculo_id, lista);
  }

  return vendas.map((v) => {
    const veiculo = veiculoPorId.get(v.veiculo_id);
    const custosLista = custosPorVeiculo.get(v.veiculo_id) ?? [];
    const custosLancados = custosLista.reduce((soma, c) => soma + c, 0);
    const custoAquisicao = veiculo?.valor_compra ?? 0;
    // Consignado: o "custo" real pra revenda é o repasse combinado, não o
    // valor_compra (que fica 0 — a revenda não comprou o veículo).
    const repasseConsignacao = repassePorVeiculo.get(v.veiculo_id) ?? 0;
    const custoTotalVeiculo = custoTotal(custoAquisicao, custosLista) + repasseConsignacao;
    const margem = v.valor_final - custoTotalVeiculo - v.comissao_valor;

    return {
      vendaId: v.id,
      veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Veículo",
      placa: veiculo?.placa ?? "—",
      dataVenda: v.data_venda,
      precoVenda: v.valor_final,
      custoAquisicao,
      custosLancados,
      comissao: v.comissao_valor,
      repasseConsignacao,
      margemR: margem,
      margemPct: calcMargemPct(margem, v.valor_final),
    };
  });
}
