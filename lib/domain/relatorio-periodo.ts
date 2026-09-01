import type { StatusParcela } from "./juros";

export type PeriodoRelatorio = { inicio: string; fim: string };

/**
 * Decide se uma parcela/conta entra num relatório filtrado por período. Uma
 * conta com vencimento anterior ao período mas ainda `Atrasada`/`Parcial` é
 * dívida em aberto, não um fato do passado — precisa continuar aparecendo em
 * todo relatório seguinte até ser paga (bug real: cliente inadimplente desde
 * maio sumia do relatório de setembro porque só o vencimento era comparado
 * contra o período, sem olhar se a dívida seguia aberta).
 */
export function dentroDoPeriodoDeRelatorio(
  vencimento: string,
  status: StatusParcela,
  periodo: PeriodoRelatorio,
): boolean {
  if (vencimento > periodo.fim) return false;
  const aindaEmAberto = status === "Atrasada" || status === "Parcial";
  if (vencimento < periodo.inicio && !aindaEmAberto) return false;
  return true;
}
