/**
 * Agregação pura de fluxo de caixa (Fase 12) — mesmo padrão de "bucket de N
 * meses com zero-fill" de `agruparVendasPorMes` (lib/domain/dashboard.ts),
 * mas com formato de saída próprio (entradas/saídas/saldo acumulado).
 */
import { MESES_ABREV } from "./dashboard";

export type MovimentoCaixa = { data: string; valor: number };

export type MesFluxoCaixa = {
  label: string;
  entradas: number;
  saidas: number;
  saldoMes: number;
  saldoAcumulado: number;
};

function chaveMes(data: string): string {
  const [ano, mes] = data.split("-").map(Number);
  return `${ano}-${mes - 1}`;
}

/** Agrupa entradas e saídas nos últimos `meses` meses corridos, com saldo mês a mês e acumulado. */
export function agruparFluxoCaixaPorMes(
  entradas: MovimentoCaixa[],
  saidas: MovimentoCaixa[],
  hoje: Date,
  meses = 12,
): MesFluxoCaixa[] {
  const buckets: { label: string; entradas: number; saidas: number }[] = [];
  const indicePorChave = new Map<string, number>();

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = `${d.getFullYear()}-${d.getMonth()}`;
    indicePorChave.set(chave, buckets.length);
    buckets.push({
      label: `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      entradas: 0,
      saidas: 0,
    });
  }

  for (const e of entradas) {
    const idx = indicePorChave.get(chaveMes(e.data));
    if (idx !== undefined) buckets[idx].entradas += e.valor;
  }
  for (const s of saidas) {
    const idx = indicePorChave.get(chaveMes(s.data));
    if (idx !== undefined) buckets[idx].saidas += s.valor;
  }

  let acumulado = 0;
  return buckets.map((b) => {
    const saldoMes = b.entradas - b.saidas;
    acumulado += saldoMes;
    return { label: b.label, entradas: b.entradas, saidas: b.saidas, saldoMes, saldoAcumulado: acumulado };
  });
}
