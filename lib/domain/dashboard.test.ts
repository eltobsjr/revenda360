import { describe, it, expect } from "vitest";
import { agruparVendasPorMes, classificarAging, calcularMixPercentual } from "./dashboard";

describe("agruparVendasPorMes", () => {
  const hoje = new Date(2026, 6, 28); // 28/07/2026

  it("gera 12 meses terminando no mês atual, com zero nos meses sem venda", () => {
    const buckets = agruparVendasPorMes([], hoje, 12);
    expect(buckets).toHaveLength(12);
    expect(buckets[0].label).toBe("Ago/25");
    expect(buckets[11].label).toBe("Jul/26");
    expect(buckets.every((b) => b.faturamento === 0 && b.lucro === 0)).toBe(true);
  });

  it("soma faturamento e lucro de vendas no mesmo mês", () => {
    const buckets = agruparVendasPorMes(
      [
        { dataVenda: "2026-07-05", faturamento: 15990, lucro: 2770 },
        { dataVenda: "2026-07-20", faturamento: 12290, lucro: 1500 },
      ],
      hoje,
      12,
    );
    const julho = buckets.find((b) => b.label === "Jul/26")!;
    expect(julho.faturamento).toBe(28280);
    expect(julho.lucro).toBe(4270);
  });

  it("ignora vendas fora da janela de meses solicitada", () => {
    const buckets = agruparVendasPorMes(
      [{ dataVenda: "2024-01-10", faturamento: 10000, lucro: 1000 }],
      hoje,
      12,
    );
    expect(buckets.reduce((a, b) => a + b.faturamento, 0)).toBe(0);
  });
});

describe("classificarAging", () => {
  it("classifica nas 4 faixas do protótipo", () => {
    expect(classificarAging(0)).toBe("0–30 dias");
    expect(classificarAging(30)).toBe("0–30 dias");
    expect(classificarAging(31)).toBe("31–60 dias");
    expect(classificarAging(60)).toBe("31–60 dias");
    expect(classificarAging(61)).toBe("61–90 dias");
    expect(classificarAging(90)).toBe("61–90 dias");
    expect(classificarAging(91)).toBe("+90 dias");
    expect(classificarAging(400)).toBe("+90 dias");
  });
});

describe("calcularMixPercentual", () => {
  it("calcula o percentual de carros e motos", () => {
    expect(calcularMixPercentual(3, 1)).toEqual({ carroPct: 75, motoPct: 25 });
  });

  it("sem veículos ativos, retorna 0/0 em vez de dividir por zero", () => {
    expect(calcularMixPercentual(0, 0)).toEqual({ carroPct: 0, motoPct: 0 });
  });

  it("100% moto quando não há carro", () => {
    expect(calcularMixPercentual(0, 4)).toEqual({ carroPct: 0, motoPct: 100 });
  });
});
