import { createClient } from "@/lib/supabase/server";
import type { StatusProposta } from "@/types/database.types";

export type PropostaRow = {
  id: string;
  veiculoId: string;
  veiculo: string;
  placa: string;
  cliente: string;
  clienteId: string | null;
  valorProposto: number;
  condicoes: string | null;
  status: StatusProposta;
  validade: string | null;
  vendedor: string;
  criadoEm: string;
};

export async function listPropostas(): Promise<PropostaRow[]> {
  const supabase = await createClient();
  const { data: propostas, error } = await supabase
    .from("propostas")
    .select(
      "id, veiculo_id, cliente_id, cliente_nome_avulso, valor_proposto, condicoes, status, validade, vendedor_id, criado_em",
    )
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao listar propostas: ${error.message}`);
  if (!propostas || propostas.length === 0) return [];

  const veiculoIds = [...new Set(propostas.map((p) => p.veiculo_id))];
  const clienteIds = [...new Set(propostas.map((p) => p.cliente_id).filter((id): id is string => !!id))];
  const vendedorIds = [...new Set(propostas.map((p) => p.vendedor_id))];

  const [veiculosRes, clientesRes, vendedoresRes] = await Promise.all([
    supabase.from("veiculos").select("id, marca, modelo, placa").in("id", veiculoIds),
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
    supabase.from("profiles").select("id, nome").in("id", vendedorIds),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos: ${veiculosRes.error.message}`);
  if (clientesRes.error) throw new Error(`Falha ao resolver clientes: ${clientesRes.error.message}`);
  if (vendedoresRes.error) throw new Error(`Falha ao resolver vendedores: ${vendedoresRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, v]));
  const clientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));
  const vendedorPorId = new Map((vendedoresRes.data ?? []).map((p) => [p.id, p.nome]));

  return propostas.map((p) => {
    const veiculo = veiculoPorId.get(p.veiculo_id);
    return {
      id: p.id,
      veiculoId: p.veiculo_id,
      veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Veículo",
      placa: veiculo?.placa ?? "—",
      cliente: p.cliente_id
        ? (clientePorId.get(p.cliente_id) ?? "Cliente")
        : (p.cliente_nome_avulso ?? "Cliente balcão"),
      clienteId: p.cliente_id,
      valorProposto: p.valor_proposto,
      condicoes: p.condicoes,
      status: p.status,
      validade: p.validade,
      vendedor: vendedorPorId.get(p.vendedor_id) ?? "Vendedor",
      criadoEm: p.criado_em,
    };
  });
}
