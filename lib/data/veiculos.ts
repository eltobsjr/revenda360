import { createClient } from "@/lib/supabase/server";
import {
  custoTotal as calcCustoTotal,
  margemR as calcMargemR,
  margemPct as calcMargemPct,
  diasEstoque as calcDiasEstoque,
  ocultarCamposSensiveis,
} from "@/lib/domain/pricing";
import type { Database, TipoVeiculo, StatusVeiculo, UserRole } from "@/types/database.types";

type VeiculoRow = Database["public"]["Tables"]["veiculos"]["Row"];
type CustoVeiculoRow = Database["public"]["Tables"]["custos_veiculo"]["Row"];
type VeiculoFotoRow = Database["public"]["Tables"]["veiculo_fotos"]["Row"];

/**
 * Veículo com campos financeiros calculados (não armazenados no banco).
 * `custo_total`/`margem_r`/`margem_pct`/`preco_minimo`/`valor_compra` são
 * removidos em runtime quando `role !== 'gestor'` — ver `ocultarCamposSensiveis`.
 * O tipo continua declarando esses campos como presentes porque TypeScript
 * não expressa bem "removido condicionalmente"; trate como possivelmente
 * ausente ao consumir fora do papel de gestor.
 */
export type VeiculoComFinanceiro = VeiculoRow & {
  custo_total: number;
  margem_r: number;
  margem_pct: number;
  dias_estoque: number;
};

export type VeiculoDetalhe = VeiculoComFinanceiro & {
  custos: CustoVeiculoRow[];
  fotos: VeiculoFotoRow[];
};

export type ListVeiculosFiltros = {
  busca?: string;
  tipo?: TipoVeiculo;
  status?: StatusVeiculo;
  marca?: string;
};

function enriquecerVeiculo(
  row: VeiculoRow & { custos_veiculo: { valor: number }[] },
  hoje: Date,
): VeiculoComFinanceiro {
  const custoTotalV = calcCustoTotal(
    row.valor_compra,
    row.custos_veiculo.map((c) => c.valor),
  );
  const margemRV = calcMargemR(row.preco_venda, custoTotalV);
  const margemPctV = calcMargemPct(margemRV, row.preco_venda);
  const diasEstoqueV = calcDiasEstoque(row.data_entrada, hoje);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- descartado de propósito, já usado acima para o cálculo
  const { custos_veiculo: _custos, ...veiculo } = row;
  return {
    ...veiculo,
    custo_total: custoTotalV,
    margem_r: margemRV,
    margem_pct: margemPctV,
    dias_estoque: diasEstoqueV,
  };
}

export async function listVeiculos(
  role: UserRole,
  filtros: ListVeiculosFiltros = {},
): Promise<VeiculoComFinanceiro[]> {
  const supabase = await createClient();
  let query = supabase
    .from("veiculos")
    .select("*, custos_veiculo(valor)")
    .order("criado_em", { ascending: false });

  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.status) query = query.eq("status", filtros.status);
  if (filtros.marca) query = query.eq("marca", filtros.marca);
  if (filtros.busca) {
    const termo = filtros.busca.trim();
    query = query.or(
      `placa.ilike.%${termo}%,modelo.ilike.%${termo}%,chassi.ilike.%${termo}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao listar veículos: ${error.message}`);

  const hoje = new Date();
  const enriquecidos = (data ?? []).map((row) => enriquecerVeiculo(row, hoje));
  return enriquecidos.map((v) => ocultarCamposSensiveis(v, role));
}

export async function getVeiculo(
  id: string,
  role: UserRole,
): Promise<VeiculoDetalhe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veiculos")
    .select("*, custos_veiculo(*), veiculo_fotos(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar veículo: ${error.message}`);
  if (!data) return null;

  const { custos_veiculo, veiculo_fotos, ...row } = data;
  const enriquecido = enriquecerVeiculo(
    { ...row, custos_veiculo: custos_veiculo.map((c) => ({ valor: c.valor })) },
    new Date(),
  );

  const detalhe: VeiculoDetalhe = {
    ...enriquecido,
    custos: custos_veiculo,
    fotos: veiculo_fotos,
  };

  return ocultarCamposSensiveis(detalhe, role);
}

/** Marcas distintas do tenant, para popular o filtro de marca. */
export async function listMarcasDisponiveis(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("veiculos").select("marca");
  if (error) throw new Error(`Falha ao listar marcas: ${error.message}`);
  const marcas = new Set((data ?? []).map((v) => v.marca));
  return Array.from(marcas).sort();
}
