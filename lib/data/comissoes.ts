import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type ComissaoVendaLinha = {
  vendaId: string;
  veiculo: string;
  cliente: string;
  dataVenda: string;
  comissaoValor: number;
  comissaoPaga: boolean;
};

export type ComissaoVendedor = {
  vendedorId: string;
  vendedor: string;
  totalPago: number;
  totalPendente: number;
  vendas: ComissaoVendaLinha[];
};

/**
 * Comissão de vendas confirmadas no período, agrupada por vendedor. É dado
 * de remuneração interna — 100% gestor. A tela hoje já redireciona quem não
 * é gestor; o filtro fica aqui também (defesa em profundidade).
 */
export async function listComissoesPorVendedor(
  dataInicial: string,
  dataFinal: string,
  role: UserRole,
): Promise<ComissaoVendedor[]> {
  if (role !== "gestor") return [];
  const supabase = await createClient();
  const { data: vendas, error } = await supabase
    .from("vendas")
    .select(
      "id, veiculo_id, cliente_id, cliente_nome_avulso, vendedor_id, data_venda, comissao_valor, comissao_paga",
    )
    .eq("status", "confirmada")
    .gte("data_venda", dataInicial)
    .lte("data_venda", dataFinal)
    .order("data_venda", { ascending: false });
  if (error) throw new Error(`Falha ao listar vendas para comissão: ${error.message}`);
  if (!vendas || vendas.length === 0) return [];

  const veiculoIds = [...new Set(vendas.map((v) => v.veiculo_id))];
  const clienteIds = [...new Set(vendas.map((v) => v.cliente_id).filter((id): id is string => !!id))];
  const vendedorIds = [...new Set(vendas.map((v) => v.vendedor_id))];

  const [veiculosRes, clientesRes, vendedoresRes] = await Promise.all([
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo").in("id", veiculoIds)
      : Promise.resolve({ data: [] as { id: string; marca: string; modelo: string }[], error: null }),
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
    vendedorIds.length
      ? supabase.from("profiles").select("id, nome").in("id", vendedorIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos: ${veiculosRes.error.message}`);
  if (clientesRes.error) throw new Error(`Falha ao resolver clientes: ${clientesRes.error.message}`);
  if (vendedoresRes.error) throw new Error(`Falha ao resolver vendedores: ${vendedoresRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, `${v.marca} ${v.modelo}`]));
  const clientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));
  const vendedorPorId = new Map((vendedoresRes.data ?? []).map((p) => [p.id, p.nome]));

  const porVendedor = new Map<string, ComissaoVendedor>();
  for (const v of vendas) {
    const atual = porVendedor.get(v.vendedor_id) ?? {
      vendedorId: v.vendedor_id,
      vendedor: vendedorPorId.get(v.vendedor_id) ?? "Vendedor",
      totalPago: 0,
      totalPendente: 0,
      vendas: [] as ComissaoVendaLinha[],
    };
    atual.vendas.push({
      vendaId: v.id,
      veiculo: veiculoPorId.get(v.veiculo_id) ?? "Veículo",
      cliente: v.cliente_id
        ? (clientePorId.get(v.cliente_id) ?? "Cliente")
        : (v.cliente_nome_avulso ?? "Cliente balcão"),
      dataVenda: v.data_venda,
      comissaoValor: v.comissao_valor,
      comissaoPaga: v.comissao_paga,
    });
    if (v.comissao_paga) atual.totalPago += v.comissao_valor;
    else atual.totalPendente += v.comissao_valor;
    porVendedor.set(v.vendedor_id, atual);
  }

  return [...porVendedor.values()].sort((a, b) => b.totalPendente - a.totalPendente);
}
