import { listVeiculos } from "@/lib/data/veiculos";
import { listParcelas } from "@/lib/data/contas-receber";
import { listContasPagar } from "@/lib/data/contas-pagar";
import type { StatusParcela } from "@/lib/domain/juros";
import type { StatusVeiculo, UserRole } from "@/types/database.types";

/** Mesmo critério de "veículo fora do estoque ativo" usado no Dashboard. */
const STATUS_INATIVO = new Set<StatusVeiculo>(["Vendido", "Devolvido"]);

export type ResumoEstoqueLinha = {
  status: StatusVeiculo;
  qtd: number;
  valorVenda: number;
  /** Ausente quando o papel não é gestor — mesmo princípio de `ocultarCamposSensiveis`. */
  custoTotal?: number;
  margem?: number;
};

export type ResumoEstoque = {
  linhas: ResumoEstoqueLinha[];
  qtdAtivos: number;
  valorVendaAtivos: number;
  custoTotalAtivos?: number;
  margemAtivos?: number;
};

/** Agrupa o estoque por status, somando valor de venda e (só gestor) custo/margem. */
export async function resumoEstoquePorStatus(role: UserRole): Promise<ResumoEstoque> {
  const veiculos = await listVeiculos(role);

  const porStatus = new Map<StatusVeiculo, ResumoEstoqueLinha>();
  for (const v of veiculos) {
    const atual = porStatus.get(v.status) ?? {
      status: v.status,
      qtd: 0,
      valorVenda: 0,
      custoTotal: "custo_total" in v ? 0 : undefined,
      margem: "margem_r" in v ? 0 : undefined,
    };
    atual.qtd += 1;
    atual.valorVenda += v.preco_venda;
    if (atual.custoTotal !== undefined && "custo_total" in v) atual.custoTotal += v.custo_total;
    if (atual.margem !== undefined && "margem_r" in v) atual.margem += v.margem_r;
    porStatus.set(v.status, atual);
  }

  const linhas = [...porStatus.values()].sort((a, b) => b.qtd - a.qtd);
  const ativos = linhas.filter((l) => !STATUS_INATIVO.has(l.status));
  const temFinanceiro = ativos.some((l) => l.custoTotal !== undefined);

  return {
    linhas,
    qtdAtivos: ativos.reduce((soma, l) => soma + l.qtd, 0),
    valorVendaAtivos: ativos.reduce((soma, l) => soma + l.valorVenda, 0),
    custoTotalAtivos: temFinanceiro
      ? ativos.reduce((soma, l) => soma + (l.custoTotal ?? 0), 0)
      : undefined,
    margemAtivos: temFinanceiro ? ativos.reduce((soma, l) => soma + (l.margem ?? 0), 0) : undefined,
  };
}

export type ResumoParcelasLinha = {
  status: StatusParcela;
  qtd: number;
  valor: number;
  valorPago: number;
};

/** Agrupa as parcelas (vendas a crediário) por status efetivo — base tanto de "vendas" quanto de "contas a receber". */
export async function resumoParcelasPorStatus(): Promise<ResumoParcelasLinha[]> {
  const parcelas = await listParcelas();

  const porStatus = new Map<StatusParcela, ResumoParcelasLinha>();
  for (const p of parcelas) {
    const atual = porStatus.get(p.status) ?? { status: p.status, qtd: 0, valor: 0, valorPago: 0 };
    atual.qtd += 1;
    atual.valor += p.valor;
    atual.valorPago += p.valorPago;
    porStatus.set(p.status, atual);
  }

  return [...porStatus.values()].sort((a, b) => b.valor - a.valor);
}

export type ResumoContasPagar = {
  porCategoria: { categoria: string; qtd: number; valor: number; valorPago: number }[];
  porStatus: { status: StatusParcela; qtd: number; valor: number }[];
};

/** Agrupa contas a pagar por categoria (visão de gasto) e por status (visão de vencimento). */
export async function resumoContasPagar(role: UserRole): Promise<ResumoContasPagar> {
  const contas = await listContasPagar(role);

  const porCategoria = new Map<string, { categoria: string; qtd: number; valor: number; valorPago: number }>();
  const porStatus = new Map<StatusParcela, { status: StatusParcela; qtd: number; valor: number }>();

  for (const c of contas) {
    const chaveCategoria = c.categoria ?? "Sem categoria";
    const atualCategoria = porCategoria.get(chaveCategoria) ?? {
      categoria: chaveCategoria,
      qtd: 0,
      valor: 0,
      valorPago: 0,
    };
    atualCategoria.qtd += 1;
    atualCategoria.valor += c.valor;
    atualCategoria.valorPago += c.valorPago;
    porCategoria.set(chaveCategoria, atualCategoria);

    const atualStatus = porStatus.get(c.status) ?? { status: c.status, qtd: 0, valor: 0 };
    atualStatus.qtd += 1;
    atualStatus.valor += c.valor;
    porStatus.set(c.status, atualStatus);
  }

  return {
    porCategoria: [...porCategoria.values()].sort((a, b) => b.valor - a.valor),
    porStatus: [...porStatus.values()].sort((a, b) => b.valor - a.valor),
  };
}
