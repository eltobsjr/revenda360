import { createClient } from "@/lib/supabase/server";
import { listVeiculosComFinanceiro } from "@/lib/data/veiculos";
import { listParcelas, listUltimasBaixas } from "@/lib/data/contas-receber";
import { agruparVendasPorMes, classificarAging, calcularMixPercentual } from "@/lib/domain/dashboard";
import type { StatusParcela } from "@/lib/domain/juros";
import type { UserRole } from "@/types/database.types";

export type Kpi = {
  label: string;
  value: string;
  sub: string | null;
  tone: "default" | "success" | "warning" | "destructive";
};

export type ParcelaVencendo = {
  contratoId: string;
  cliente: string;
  veiculo: string;
  numero: number;
  totalParcelas: number;
  vencimento: string;
  status: StatusParcela;
  saldo: number;
};

export type AgingBucket = { label: string; qtd: number; valor: number; pct: number };
export type Movimentacao = {
  tipo: "venda" | "entrada" | "recebimento";
  texto: string;
  /** Null em movimentação cujo valor é dado sensível para o papel do usuário. */
  valor: number | null;
  data: string;
};

export type DashboardData = {
  hojeFmt: string;
  podeVerFinanceiro: boolean;
  kpis: Kpi[];
  parcelasVencendo: ParcelaVencendo[];
  agingBuckets: AgingBucket[];
  mixCarroPct: number;
  mixMotoPct: number;
  topModelos: { nome: string; qtd: number }[];
  vendas12Meses: { label: string; faturamento: number; lucro: number }[];
  movimentacoes: Movimentacao[];
};

const STATUS_INATIVO = new Set(["Vendido", "Devolvido"]);

export async function getDashboardData(role: UserRole): Promise<DashboardData> {
  const supabase = await createClient();
  const hoje = new Date();
  const podeVerFinanceiro = role === "gestor";

  const veiculos = await listVeiculosComFinanceiro();
  const veiculosPorId = new Map(veiculos.map((v) => [v.id, v]));
  const ativos = veiculos.filter((v) => !STATUS_INATIVO.has(v.status));

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const inicioJanela12Meses = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)
    .toISOString()
    .slice(0, 10);

  const { data: vendasJanela, error: vendasError } = await supabase
    .from("vendas")
    .select("veiculo_id, valor_final, comissao_valor, data_venda")
    .eq("status", "confirmada")
    .gte("data_venda", inicioJanela12Meses);
  if (vendasError) throw new Error(`Falha ao listar vendas: ${vendasError.message}`);

  const vendas = vendasJanela ?? [];
  const vendasMes = vendas.filter((v) => v.data_venda >= inicioMes);

  const faturamentoMes = vendasMes.reduce((soma, v) => soma + v.valor_final, 0);
  const qtdVendasMes = vendasMes.length;
  const ticketMedio = qtdVendasMes > 0 ? faturamentoMes / qtdVendasMes : 0;

  function lucroVenda(v: { veiculo_id: string; valor_final: number; comissao_valor: number }): number {
    const custo = veiculosPorId.get(v.veiculo_id)?.custo_total ?? 0;
    return v.valor_final - custo - v.comissao_valor;
  }
  const lucroMes = vendasMes.reduce((soma, v) => soma + lucroVenda(v), 0);

  const margemMedia =
    ativos.length > 0 ? ativos.reduce((soma, v) => soma + v.margem_pct, 0) / ativos.length : 0;

  const estoqueValor = ativos.reduce((soma, v) => soma + v.preco_venda, 0);
  const giroMedio =
    ativos.length > 0
      ? Math.round(ativos.reduce((soma, v) => soma + v.dias_estoque, 0) / ativos.length)
      : 0;

  const parcelas = await listParcelas();
  const parcelasAbertas = parcelas.filter((p) => p.status !== "Paga");
  const aReceberTotal = parcelasAbertas.reduce((soma, p) => soma + (p.valor - p.valorPago), 0);
  const atrasadoR = parcelasAbertas
    .filter((p) => p.status === "Atrasada" || p.status === "Parcial")
    .reduce((soma, p) => soma + (p.valor - p.valorPago), 0);
  const inadimplPct = aReceberTotal > 0 ? (atrasadoR / aReceberTotal) * 100 : 0;

  const kpis: Kpi[] = [
    {
      label: "Em estoque",
      value: `${ativos.length} veíc.`,
      sub: `${formatBRLSemDecimais(estoqueValor)} imobilizado`,
      tone: "default",
    },
    {
      label: "Vendas no mês",
      value: `${qtdVendasMes} vendas`,
      sub: `${formatBRLSemDecimais(faturamentoMes)} fatur.`,
      tone: "default",
    },
    ...(podeVerFinanceiro
      ? [{ label: "Lucro líquido", value: formatBRLSemDecimais(lucroMes), sub: null, tone: "success" as const }]
      : []),
    { label: "Ticket médio", value: formatBRLSemDecimais(ticketMedio), sub: null, tone: "default" },
    ...(podeVerFinanceiro
      ? [{ label: "Margem média", value: `${margemMedia.toFixed(1)}%`, sub: null, tone: "default" as const }]
      : []),
    {
      label: "A receber",
      value: formatBRLSemDecimais(aReceberTotal),
      sub: `${parcelasAbertas.length} parcelas`,
      tone: "default",
    },
    {
      label: "Inadimplência",
      value: `${inadimplPct.toFixed(1)}%`,
      sub: `${formatBRLSemDecimais(atrasadoR)} em atraso`,
      tone: inadimplPct > 10 ? "destructive" : "warning",
    },
    { label: "Giro médio", value: `${giroMedio} dias`, sub: null, tone: "default" },
  ];

  const proximaPorContrato = new Map<string, (typeof parcelas)[number]>();
  for (const p of parcelas) {
    if (p.status === "Paga") continue;
    const atual = proximaPorContrato.get(p.contratoId);
    if (!atual || p.numero < atual.numero) proximaPorContrato.set(p.contratoId, p);
  }
  const parcelasVencendo: ParcelaVencendo[] = [...proximaPorContrato.values()]
    // Atrasadas primeiro e, dentro de cada grupo, a que vence antes. O
    // comparador precisa ser consistente (mesmo par → mesmo resultado): um
    // comparador que só olha `a` faz o sort devolver ordem arbitrária.
    .sort((a, b) => {
      const atrasoA = a.status === "Atrasada" ? 0 : 1;
      const atrasoB = b.status === "Atrasada" ? 0 : 1;
      if (atrasoA !== atrasoB) return atrasoA - atrasoB;
      return a.vencimento.localeCompare(b.vencimento);
    })
    .slice(0, 5)
    .map((p) => ({
      contratoId: p.contratoId,
      cliente: p.cliente,
      veiculo: p.veiculo,
      numero: p.numero,
      totalParcelas: p.totalParcelas,
      vencimento: p.vencimento,
      status: p.status,
      saldo: p.valor - p.valorPago,
    }));

  const bucketsBase: AgingBucket[] = [
    { label: "0–30 dias", qtd: 0, valor: 0, pct: 0 },
    { label: "31–60 dias", qtd: 0, valor: 0, pct: 0 },
    { label: "61–90 dias", qtd: 0, valor: 0, pct: 0 },
    { label: "+90 dias", qtd: 0, valor: 0, pct: 0 },
  ];
  const bucketPorLabel = new Map(bucketsBase.map((b) => [b.label, b]));
  for (const v of ativos) {
    const bucket = bucketPorLabel.get(classificarAging(v.dias_estoque))!;
    bucket.qtd += 1;
    bucket.valor += v.preco_venda;
  }
  for (const b of bucketsBase) b.pct = ativos.length > 0 ? (b.qtd / ativos.length) * 100 : 0;

  const carros = ativos.filter((v) => v.tipo === "carro").length;
  const motos = ativos.filter((v) => v.tipo === "moto").length;
  const { carroPct: mixCarroPct, motoPct: mixMotoPct } = calcularMixPercentual(carros, motos);

  const modeloCount = new Map<string, number>();
  for (const v of veiculos) {
    const chave = `${v.marca} ${v.modelo}`;
    modeloCount.set(chave, (modeloCount.get(chave) ?? 0) + 1);
  }
  const topModelos = [...modeloCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, qtd]) => ({ nome, qtd }));

  const vendas12Meses = agruparVendasPorMes(
    vendas.map((v) => ({
      dataVenda: v.data_venda,
      faturamento: v.valor_final,
      lucro: podeVerFinanceiro ? lucroVenda(v) : 0,
    })),
    hoje,
    12,
  ).map((m) => ({ label: m.label, faturamento: m.faturamento, lucro: m.lucro }));

  const movimentacoes = await listarMovimentacoesRecentes(6, podeVerFinanceiro);

  return {
    hojeFmt: hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    podeVerFinanceiro,
    kpis,
    parcelasVencendo,
    agingBuckets: bucketsBase,
    mixCarroPct,
    mixMotoPct,
    topModelos,
    vendas12Meses,
    movimentacoes,
  };
}

async function listarMovimentacoesRecentes(
  limite: number,
  podeVerFinanceiro: boolean,
): Promise<Movimentacao[]> {
  const supabase = await createClient();

  const [vendasRes, entradasRes, baixas] = await Promise.all([
    supabase
      .from("vendas")
      .select("veiculo_id, cliente_id, cliente_nome_avulso, valor_final, data_venda")
      .order("data_venda", { ascending: false })
      .limit(limite),
    supabase
      .from("veiculos")
      .select("marca, modelo, valor_compra, data_entrada")
      .order("data_entrada", { ascending: false })
      .limit(limite),
    listUltimasBaixas(limite),
  ]);
  if (vendasRes.error) throw new Error(`Falha ao listar vendas recentes: ${vendasRes.error.message}`);
  if (entradasRes.error) throw new Error(`Falha ao listar entradas recentes: ${entradasRes.error.message}`);

  const vendasRows = vendasRes.data ?? [];
  const veiculoIds = [...new Set(vendasRows.map((v) => v.veiculo_id))];
  const clienteIds = [...new Set(vendasRows.map((v) => v.cliente_id).filter((id): id is string => !!id))];

  const [veiculosRes, clientesRes] = await Promise.all([
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo").in("id", veiculoIds)
      : Promise.resolve({ data: [] as { id: string; marca: string; modelo: string }[], error: null }),
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos das vendas: ${veiculosRes.error.message}`);
  if (clientesRes.error) throw new Error(`Falha ao resolver clientes das vendas: ${clientesRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, `${v.marca} ${v.modelo}`]));
  const clientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));

  const movVendas: Movimentacao[] = vendasRows.map((v) => {
    const nomeCliente = v.cliente_id
      ? (clientePorId.get(v.cliente_id) ?? "Cliente")
      : (v.cliente_nome_avulso ?? "Cliente balcão");
    return {
      tipo: "venda",
      texto: `Venda: ${veiculoPorId.get(v.veiculo_id) ?? "Veículo"} para ${nomeCliente}`,
      valor: v.valor_final,
      data: v.data_venda,
    };
  });

  // O valor de uma entrada é o custo de aquisição do veículo — dado de gestor.
  const movEntradas: Movimentacao[] = (entradasRes.data ?? []).map((v) => ({
    tipo: "entrada",
    texto: `Entrada em estoque: ${v.marca} ${v.modelo}`,
    valor: podeVerFinanceiro ? -v.valor_compra : null,
    data: v.data_entrada,
  }));

  const movBaixas: Movimentacao[] = baixas.map((b) => ({
    tipo: "recebimento",
    texto: `Baixa de parcela ${b.numero}/${b.totalParcelas} — ${b.cliente}`,
    valor: b.valorPago,
    data: b.dataPagamento,
  }));

  return [...movVendas, ...movEntradas, ...movBaixas]
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
    .slice(0, limite);
}

function formatBRLSemDecimais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
