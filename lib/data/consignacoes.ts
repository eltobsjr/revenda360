import { createClient } from "@/lib/supabase/server";

export type ConsignacaoDisponivel = {
  id: string;
  veiculoId: string;
  veiculo: string;
  placa: string;
  consignanteNome: string;
  consignanteContato: string | null;
  valorRepasse: number;
  precoVenda: number;
};

export type ConsignacaoVendida = {
  id: string;
  veiculo: string;
  placa: string;
  consignanteNome: string;
  valorRepasse: number;
  valorVenda: number;
  /** Valor de venda − repasse ao consignante (comissão fixa, decisão confirmada com o Enzo na Fase 15). */
  comissaoRevenda: number;
  dataVenda: string;
};

/** Consignados ainda não vendidos — `contas_pagar_id` só é preenchido por `fechar_venda` quando o veículo é vendido. */
export async function listConsignacoesDisponiveis(): Promise<ConsignacaoDisponivel[]> {
  const supabase = await createClient();
  const { data: consignacoes, error } = await supabase
    .from("consignacoes")
    .select("id, veiculo_id, consignante_nome, consignante_contato, valor_repasse")
    .is("contas_pagar_id", null);
  if (error) throw new Error(`Falha ao listar consignados: ${error.message}`);
  if (!consignacoes || consignacoes.length === 0) return [];

  const veiculoIds = consignacoes.map((c) => c.veiculo_id);
  const { data: veiculos, error: veiculosError } = await supabase
    .from("veiculos")
    .select("id, marca, modelo, placa, preco_venda")
    .in("id", veiculoIds);
  if (veiculosError) throw new Error(`Falha ao resolver veículos consignados: ${veiculosError.message}`);
  const veiculoPorId = new Map((veiculos ?? []).map((v) => [v.id, v]));

  return consignacoes.map((c) => {
    const veiculo = veiculoPorId.get(c.veiculo_id);
    return {
      id: c.id,
      veiculoId: c.veiculo_id,
      veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Veículo",
      placa: veiculo?.placa ?? "—",
      consignanteNome: c.consignante_nome,
      consignanteContato: c.consignante_contato,
      valorRepasse: c.valor_repasse,
      precoVenda: veiculo?.preco_venda ?? 0,
    };
  });
}

/** Consignados já vendidos — mostra o repasse combinado x quanto ficou de comissão pra revenda. */
export async function listConsignacoesVendidas(): Promise<ConsignacaoVendida[]> {
  const supabase = await createClient();
  const { data: consignacoes, error } = await supabase
    .from("consignacoes")
    .select("id, veiculo_id, consignante_nome, valor_repasse")
    .not("contas_pagar_id", "is", null);
  if (error) throw new Error(`Falha ao listar consignados vendidos: ${error.message}`);
  if (!consignacoes || consignacoes.length === 0) return [];

  const veiculoIds = consignacoes.map((c) => c.veiculo_id);
  const [veiculosRes, vendasRes] = await Promise.all([
    supabase.from("veiculos").select("id, marca, modelo, placa").in("id", veiculoIds),
    supabase
      .from("vendas")
      .select("veiculo_id, valor_final, data_venda")
      .in("veiculo_id", veiculoIds)
      .eq("status", "confirmada"),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos: ${veiculosRes.error.message}`);
  if (vendasRes.error) throw new Error(`Falha ao resolver vendas: ${vendasRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, v]));
  const vendaPorVeiculoId = new Map((vendasRes.data ?? []).map((v) => [v.veiculo_id, v]));

  return consignacoes
    .map((c) => {
      const veiculo = veiculoPorId.get(c.veiculo_id);
      const venda = vendaPorVeiculoId.get(c.veiculo_id);
      const valorVenda = venda?.valor_final ?? 0;
      return {
        id: c.id,
        veiculo: veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Veículo",
        placa: veiculo?.placa ?? "—",
        consignanteNome: c.consignante_nome,
        valorRepasse: c.valor_repasse,
        valorVenda,
        comissaoRevenda: valorVenda - c.valor_repasse,
        dataVenda: venda?.data_venda ?? "",
      };
    })
    .sort((a, b) => b.dataVenda.localeCompare(a.dataVenda));
}
