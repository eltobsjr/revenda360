import { createClient } from "@/lib/supabase/server";
import { calcularDiasAtraso, statusEfetivo, type StatusParcela } from "@/lib/domain/juros";

/**
 * Uma linha da visão "Por parcela". `cliente`/`veiculo` são resolvidos em
 * consultas separadas (não embed aninhado do Supabase) — mais simples de
 * tipar e testar do que um `select` com múltiplos níveis de join, e o
 * volume de contratos/parcelas de uma revenda não justifica a otimização.
 */
export type ParcelaRow = {
  id: string;
  contratoId: string;
  numero: number;
  totalParcelas: number;
  cliente: string;
  veiculo: string;
  vencimento: string;
  valor: number;
  valorPago: number;
  status: StatusParcela;
  diasAtraso: number;
  podeBaixar: boolean;
};

export type ContratoRow = {
  id: string;
  cliente: string;
  veiculo: string;
  pctPago: number;
  totalPago: number;
  saldo: number;
  proximoVencimento: string | null;
};

export type InadimplenciaRow = {
  cliente: string;
  faixa: string;
  valorEmAtraso: number;
  maiorAtraso: number;
};

type ContratoBase = {
  id: string;
  qtd_parcelas: number;
  valor_total: number;
  cliente_id: string | null;
  veiculo_id: string;
  venda_id: string;
};

async function carregarContratosBase(): Promise<Map<string, ContratoBase>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contratos_crediario")
    .select("id, qtd_parcelas, valor_total, cliente_id, veiculo_id, venda_id");
  if (error) throw new Error(`Falha ao listar contratos de crediário: ${error.message}`);

  const mapa = new Map<string, ContratoBase>();
  for (const c of data ?? []) mapa.set(c.id, c);
  return mapa;
}

/** Nomes de cliente/veículo para os contratos informados, resolvidos em lote. */
async function resolverNomes(contratos: ContratoBase[]) {
  const supabase = await createClient();

  const clienteIds = [...new Set(contratos.map((c) => c.cliente_id).filter((id): id is string => !!id))];
  const veiculoIds = [...new Set(contratos.map((c) => c.veiculo_id))];
  const vendaIds = [...new Set(contratos.map((c) => c.venda_id))];

  const [clientesRes, veiculosRes, vendasRes] = await Promise.all([
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo").in("id", veiculoIds)
      : Promise.resolve({ data: [] as { id: string; marca: string; modelo: string }[], error: null }),
    vendaIds.length
      ? supabase.from("vendas").select("id, cliente_nome_avulso").in("id", vendaIds)
      : Promise.resolve({ data: [] as { id: string; cliente_nome_avulso: string | null }[], error: null }),
  ]);

  if (clientesRes.error) throw new Error(`Falha ao resolver clientes: ${clientesRes.error.message}`);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos: ${veiculosRes.error.message}`);
  if (vendasRes.error) throw new Error(`Falha ao resolver vendas: ${vendasRes.error.message}`);

  const nomeClientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));
  const veiculoPorId = new Map(
    (veiculosRes.data ?? []).map((v) => [v.id, `${v.marca} ${v.modelo}`]),
  );
  const nomeAvulsoPorVenda = new Map(
    (vendasRes.data ?? []).map((v) => [v.id, v.cliente_nome_avulso]),
  );

  function nomeCliente(contrato: ContratoBase): string {
    if (contrato.cliente_id) return nomeClientePorId.get(contrato.cliente_id) ?? "Cliente";
    return nomeAvulsoPorVenda.get(contrato.venda_id) ?? "Cliente balcão";
  }

  function nomeVeiculo(contrato: ContratoBase): string {
    return veiculoPorId.get(contrato.veiculo_id) ?? "Veículo";
  }

  return { nomeCliente, nomeVeiculo };
}

const FAIXAS_ATRASO = [
  { max: 15, label: "1–15 dias" },
  { max: 30, label: "16–30 dias" },
  { max: 60, label: "31–60 dias" },
  { max: Infinity, label: "+60 dias" },
] as const;

function faixaDeAtraso(dias: number): string {
  return FAIXAS_ATRASO.find((f) => dias <= f.max)!.label;
}

/** Todas as parcelas de todos os contratos do tenant, com status efetivo calculado. */
export async function listParcelas(filtroStatus?: StatusParcela): Promise<ParcelaRow[]> {
  const supabase = await createClient();
  const contratosPorId = await carregarContratosBase();
  const contratos = [...contratosPorId.values()];
  if (contratos.length === 0) return [];

  const { nomeCliente, nomeVeiculo } = await resolverNomes(contratos);

  const { data: parcelas, error } = await supabase
    .from("parcelas")
    .select("id, contrato_id, numero, vencimento, valor, valor_pago, status")
    .in("contrato_id", contratos.map((c) => c.id))
    .order("vencimento");
  if (error) throw new Error(`Falha ao listar parcelas: ${error.message}`);

  const hoje = new Date();
  const linhas: ParcelaRow[] = (parcelas ?? []).map((p) => {
    const contrato = contratosPorId.get(p.contrato_id)!;
    const status = statusEfetivo(p.status, p.vencimento, hoje);
    return {
      id: p.id,
      contratoId: p.contrato_id,
      numero: p.numero,
      totalParcelas: contrato.qtd_parcelas,
      cliente: nomeCliente(contrato),
      veiculo: nomeVeiculo(contrato),
      vencimento: p.vencimento,
      valor: p.valor,
      valorPago: p.valor_pago,
      status,
      diasAtraso: status === "Atrasada" || status === "Parcial" ? calcularDiasAtraso(p.vencimento, hoje) : 0,
      podeBaixar: status !== "Paga",
    };
  });

  return filtroStatus ? linhas.filter((l) => l.status === filtroStatus) : linhas;
}

/** Progresso de pagamento por contrato de crediário. */
export async function listContratos(): Promise<ContratoRow[]> {
  const supabase = await createClient();
  const contratosPorId = await carregarContratosBase();
  const contratos = [...contratosPorId.values()];
  if (contratos.length === 0) return [];

  const { nomeCliente, nomeVeiculo } = await resolverNomes(contratos);

  const { data: parcelas, error } = await supabase
    .from("parcelas")
    .select("contrato_id, vencimento, valor_pago, status")
    .in("contrato_id", contratos.map((c) => c.id))
    .order("vencimento");
  if (error) throw new Error(`Falha ao listar parcelas dos contratos: ${error.message}`);

  const porContrato = new Map<string, { valorPago: number; proxima: string | null }>();
  for (const c of contratos) porContrato.set(c.id, { valorPago: 0, proxima: null });

  for (const p of parcelas ?? []) {
    const acc = porContrato.get(p.contrato_id)!;
    acc.valorPago += p.valor_pago;
    if (p.status !== "Paga" && acc.proxima === null) acc.proxima = p.vencimento;
  }

  return contratos.map((contrato) => {
    const acc = porContrato.get(contrato.id)!;
    const saldo = Math.max(0, contrato.valor_total - acc.valorPago);
    const pctPago =
      contrato.valor_total > 0 ? Math.min(100, Math.round((acc.valorPago / contrato.valor_total) * 100)) : 0;
    return {
      id: contrato.id,
      cliente: nomeCliente(contrato),
      veiculo: nomeVeiculo(contrato),
      pctPago,
      totalPago: acc.valorPago,
      saldo,
      proximoVencimento: acc.proxima,
    };
  });
}

/** Valor em atraso agrupado por cliente, para priorizar cobrança. */
export async function listInadimplencia(): Promise<InadimplenciaRow[]> {
  const parcelas = await listParcelas();
  const hoje = new Date();

  const porCliente = new Map<string, { valor: number; maiorAtraso: number }>();
  for (const p of parcelas) {
    if (p.status !== "Atrasada" && p.status !== "Parcial") continue;
    const dias = calcularDiasAtraso(p.vencimento, hoje);
    const saldo = p.valor - p.valorPago;
    const atual = porCliente.get(p.cliente) ?? { valor: 0, maiorAtraso: 0 };
    porCliente.set(p.cliente, {
      valor: atual.valor + saldo,
      maiorAtraso: Math.max(atual.maiorAtraso, dias),
    });
  }

  return [...porCliente.entries()]
    .map(([cliente, v]) => ({
      cliente,
      faixa: faixaDeAtraso(v.maiorAtraso),
      valorEmAtraso: v.valor,
      maiorAtraso: v.maiorAtraso,
    }))
    .sort((a, b) => b.valorEmAtraso - a.valorEmAtraso);
}

/** Uma parcela específica com os dados necessários para o modal de baixa. */
export async function getParcelaParaBaixa(parcelaId: string): Promise<{
  id: string;
  cliente: string;
  veiculo: string;
  numero: number;
  totalParcelas: number;
  vencimento: string;
  valor: number;
  status: StatusParcela;
} | null> {
  const supabase = await createClient();
  const { data: parcela, error } = await supabase
    .from("parcelas")
    .select("id, contrato_id, numero, vencimento, valor, status")
    .eq("id", parcelaId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar parcela: ${error.message}`);
  if (!parcela) return null;

  const { data: contratoRow, error: contratoError } = await supabase
    .from("contratos_crediario")
    .select("id, qtd_parcelas, cliente_id, veiculo_id, venda_id")
    .eq("id", parcela.contrato_id)
    .single();
  if (contratoError) throw new Error(`Falha ao buscar contrato da parcela: ${contratoError.message}`);

  const contrato: ContratoBase = { ...contratoRow, valor_total: 0 };
  const { nomeCliente, nomeVeiculo } = await resolverNomes([contrato]);

  return {
    id: parcela.id,
    cliente: nomeCliente(contrato),
    veiculo: nomeVeiculo(contrato),
    numero: parcela.numero,
    totalParcelas: contrato.qtd_parcelas,
    vencimento: parcela.vencimento,
    valor: parcela.valor,
    status: statusEfetivo(parcela.status, parcela.vencimento, new Date()),
  };
}
