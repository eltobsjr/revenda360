/**
 * Funções puras de agregação usadas pelo Dashboard (Fase 6) — sem I/O, para
 * poderem ser testadas isoladamente das consultas ao Supabase.
 */

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
] as const;

export type VendaParaGrafico = { dataVenda: string; faturamento: number; lucro: number };
export type MesGrafico = { label: string; faturamento: number; lucro: number };

/**
 * Agrupa vendas nos últimos `meses` meses corridos (incluindo o mês
 * atual), preenchendo com zero os meses sem venda — o gráfico precisa dos
 * 12 pontos mesmo quando não há dado, não só dos meses com movimento.
 */
export function agruparVendasPorMes(
  vendas: VendaParaGrafico[],
  hoje: Date,
  meses = 12,
): MesGrafico[] {
  const buckets: MesGrafico[] = [];
  const indicePorChave = new Map<string, number>();

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    indicePorChave.set(chave, buckets.length);
    buckets.push({
      label: `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      faturamento: 0,
      lucro: 0,
    });
  }

  for (const v of vendas) {
    const [ano, mes] = v.dataVenda.split("-").map(Number);
    const idx = indicePorChave.get(`${ano}-${mes - 1}`);
    if (idx === undefined) continue;
    buckets[idx].faturamento += v.faturamento;
    buckets[idx].lucro += v.lucro;
  }

  return buckets;
}

export type FaixaAging = "0–30 dias" | "31–60 dias" | "61–90 dias" | "+90 dias";

/** Classifica um veículo em atividade pela quantidade de dias em estoque. */
export function classificarAging(diasEstoque: number): FaixaAging {
  if (diasEstoque <= 30) return "0–30 dias";
  if (diasEstoque <= 60) return "31–60 dias";
  if (diasEstoque <= 90) return "61–90 dias";
  return "+90 dias";
}

/** % de carros vs. motos no estoque ativo. Sem veículos ativos, retorna 0/0. */
export function calcularMixPercentual(
  carros: number,
  motos: number,
): { carroPct: number; motoPct: number } {
  const total = carros + motos;
  if (total === 0) return { carroPct: 0, motoPct: 0 };
  const carroPct = Math.round((carros / total) * 100);
  return { carroPct, motoPct: 100 - carroPct };
}
