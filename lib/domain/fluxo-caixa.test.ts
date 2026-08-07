import { describe, it, expect } from "vitest";
import { agruparFluxoCaixaPorMes } from "./fluxo-caixa";

describe("agruparFluxoCaixaPorMes", () => {
  const hoje = new Date(2026, 6, 28); // 28/07/2026

  it("gera 12 meses terminando no mês atual, zerados sem movimento", () => {
    const buckets = agruparFluxoCaixaPorMes([], [], hoje, 12);
    expect(buckets).toHaveLength(12);
    expect(buckets[0].label).toBe("Ago/25");
    expect(buckets[11].label).toBe("Jul/26");
    expect(buckets.every((b) => b.entradas === 0 && b.saidas === 0 && b.saldoMes === 0)).toBe(
      true,
    );
  });

  it("soma entradas e saídas no mesmo mês e calcula o saldo do mês", () => {
    const buckets = agruparFluxoCaixaPorMes(
      [
        { data: "2026-07-05", valor: 15000 },
        { data: "2026-07-20", valor: 5000 },
      ],
      [{ data: "2026-07-10", valor: 8000 }],
      hoje,
      12,
    );
    const julho = buckets.find((b) => b.label === "Jul/26")!;
    expect(julho.entradas).toBe(20000);
    expect(julho.saidas).toBe(8000);
    expect(julho.saldoMes).toBe(12000);
  });

  it("acumula o saldo mês a mês ao longo da janela", () => {
    const buckets = agruparFluxoCaixaPorMes(
      [
        { data: "2026-06-10", valor: 10000 },
        { data: "2026-07-10", valor: 3000 },
      ],
      [{ data: "2026-06-15", valor: 4000 }],
      hoje,
      12,
    );
    const junho = buckets.find((b) => b.label === "Jun/26")!;
    const julho = buckets.find((b) => b.label === "Jul/26")!;
    expect(junho.saldoMes).toBe(6000);
    expect(junho.saldoAcumulado).toBe(6000);
    expect(julho.saldoMes).toBe(3000);
    expect(julho.saldoAcumulado).toBe(9000);
  });

  it("ignora movimentos fora da janela de meses solicitada", () => {
    const buckets = agruparFluxoCaixaPorMes(
      [{ data: "2024-01-10", valor: 10000 }],
      [{ data: "2024-01-10", valor: 5000 }],
      hoje,
      12,
    );
    expect(buckets.reduce((a, b) => a + b.entradas + b.saidas, 0)).toBe(0);
  });
});
