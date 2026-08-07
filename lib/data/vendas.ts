import { createClient } from "@/lib/supabase/server";
import type { StatusVenda, TipoPagamento, UserRole } from "@/types/database.types";

export type VendaPagamentoLinha = {
  tipo: TipoPagamento;
  valor: number;
};

/**
 * `comissaoValor`/`comissaoPct` ficam ausentes quando o papel não é gestor —
 * dado financeiro interno, mesmo critério de `lib/data/veiculos.ts`.
 */
export type VendaRow = {
  id: string;
  veiculo: string;
  placa: string;
  cliente: string;
  vendedor: string;
  dataVenda: string;
  valorFinal: number;
  status: StatusVenda;
  comissaoValor?: number;
  comissaoPct?: number;
  pagamentos: VendaPagamentoLinha[];
};

export type ListVendasFiltros = {
  dataInicial?: string;
  dataFinal?: string;
  status?: StatusVenda;
  clienteId?: string;
};

export async function listVendas(
  role: UserRole,
  filtros: ListVendasFiltros = {},
): Promise<VendaRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vendas")
    .select(
      "id, veiculo_id, cliente_id, cliente_nome_avulso, vendedor_id, data_venda, valor_final, comissao_valor, comissao_pct, status",
    )
    .order("data_venda", { ascending: false })
    .order("criado_em", { ascending: false });

  if (filtros.dataInicial) query = query.gte("data_venda", filtros.dataInicial);
  if (filtros.dataFinal) query = query.lte("data_venda", filtros.dataFinal);
  if (filtros.status) query = query.eq("status", filtros.status);
  if (filtros.clienteId) query = query.eq("cliente_id", filtros.clienteId);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar vendas: ${error.message}`);
  const vendas = data ?? [];
  if (vendas.length === 0) return [];

  const veiculoIds = [...new Set(vendas.map((v) => v.veiculo_id))];
  const clienteIds = [...new Set(vendas.map((v) => v.cliente_id).filter((id): id is string => !!id))];
  const vendedorIds = [...new Set(vendas.map((v) => v.vendedor_id))];
  const vendaIds = vendas.map((v) => v.id);

  const [veiculosRes, clientesRes, vendedoresRes, pagamentosRes] = await Promise.all([
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo, placa").in("id", veiculoIds)
      : Promise.resolve({
          data: [] as { id: string; marca: string; modelo: string; placa: string }[],
          error: null,
        }),
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
    vendedorIds.length
      ? supabase.from("profiles").select("id, nome").in("id", vendedorIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
    supabase.from("venda_pagamentos").select("venda_id, tipo, valor").in("venda_id", vendaIds),
  ]);

  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos das vendas: ${veiculosRes.error.message}`);
  if (clientesRes.error) throw new Error(`Falha ao resolver clientes das vendas: ${clientesRes.error.message}`);
  if (vendedoresRes.error)
    throw new Error(`Falha ao resolver vendedores das vendas: ${vendedoresRes.error.message}`);
  if (pagamentosRes.error)
    throw new Error(`Falha ao resolver pagamentos das vendas: ${pagamentosRes.error.message}`);

  const veiculoPorId = new Map(
    (veiculosRes.data ?? []).map((v) => [v.id, { nome: `${v.marca} ${v.modelo}`, placa: v.placa }]),
  );
  const clientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));
  const vendedorPorId = new Map((vendedoresRes.data ?? []).map((p) => [p.id, p.nome]));

  const pagamentosPorVenda = new Map<string, VendaPagamentoLinha[]>();
  for (const p of pagamentosRes.data ?? []) {
    const lista = pagamentosPorVenda.get(p.venda_id) ?? [];
    lista.push({ tipo: p.tipo, valor: p.valor });
    pagamentosPorVenda.set(p.venda_id, lista);
  }

  return vendas.map((v) => {
    const veiculo = veiculoPorId.get(v.veiculo_id);
    const linha: VendaRow = {
      id: v.id,
      veiculo: veiculo?.nome ?? "Veículo",
      placa: veiculo?.placa ?? "—",
      cliente: v.cliente_id ? (clientePorId.get(v.cliente_id) ?? "Cliente") : (v.cliente_nome_avulso ?? "Cliente balcão"),
      vendedor: vendedorPorId.get(v.vendedor_id) ?? "Vendedor",
      dataVenda: v.data_venda,
      valorFinal: v.valor_final,
      status: v.status,
      pagamentos: pagamentosPorVenda.get(v.id) ?? [],
    };
    if (role !== "gestor") return linha;
    return { ...linha, comissaoValor: v.comissao_valor, comissaoPct: v.comissao_pct };
  });
}
