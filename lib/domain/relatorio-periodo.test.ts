import { describe, it, expect } from "vitest";
import { dentroDoPeriodoDeRelatorio } from "./relatorio-periodo";

// Relatório de setembro/2026: cliente com parcela vencida em maio (bug real
// relatado por Enzo — cliente inadimplente desde maio, última nota em
// agosto, sumia do relatório ao selecionar setembro).
const PERIODO_SETEMBRO = { inicio: "2026-09-01", fim: "2026-09-30" };

describe("dentroDoPeriodoDeRelatorio", () => {
  it("inclui parcela com vencimento dentro do período, qualquer status", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-09-15", "A vencer", PERIODO_SETEMBRO)).toBe(true);
    expect(dentroDoPeriodoDeRelatorio("2026-09-15", "Paga", PERIODO_SETEMBRO)).toBe(true);
  });

  it("mantém parcela Atrasada com vencimento anterior ao período — dívida ainda em aberto", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-05-10", "Atrasada", PERIODO_SETEMBRO)).toBe(true);
  });

  it("mantém parcela Parcial com vencimento anterior ao período — saldo ainda em aberto", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-08-10", "Parcial", PERIODO_SETEMBRO)).toBe(true);
  });

  it("exclui parcela Paga com vencimento anterior ao período — já quitada, não é dívida do mês", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-05-10", "Paga", PERIODO_SETEMBRO)).toBe(false);
  });

  it("exclui parcela 'A vencer' com vencimento futuro além do período", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-11-01", "A vencer", PERIODO_SETEMBRO)).toBe(false);
  });

  it("exclui mesmo parcela em aberto se o vencimento for depois do fim do período", () => {
    expect(dentroDoPeriodoDeRelatorio("2026-11-01", "Atrasada", PERIODO_SETEMBRO)).toBe(false);
  });
});
