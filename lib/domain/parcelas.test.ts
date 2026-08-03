import { describe, it, expect } from "vitest";
import { gerarParcelas, adicionarMeses } from "./parcelas";

describe("gerarParcelas", () => {
  it("aplica a fórmula de juros simples validada contra o protótipo", () => {
    const parcelas = gerarParcelas(12000, 2.5, 6, "2026-08-28");

    // valorComJuros = 12000 * (1 + 0.025 * 3) = 12900; parcela = 12900/6 = 2150
    expect(parcelas).toHaveLength(6);
    for (const p of parcelas) {
      expect(p.valor).toBe(2150);
    }
    expect(parcelas[0].numero).toBe(1);
    expect(parcelas[0].vencimento).toBe("2026-08-28");
    expect(parcelas[5].numero).toBe(6);
    expect(parcelas[5].vencimento).toBe("2027-01-28");
  });

  it("sem juros (taxa 0), divide o valor base igualmente entre as parcelas", () => {
    const parcelas = gerarParcelas(6000, 0, 6, "2026-03-10");
    for (const p of parcelas) {
      expect(p.valor).toBe(1000);
    }
  });

  it("soma das parcelas fecha com o valor financiado quando a divisão não é exata", () => {
    // Arredondando cada parcela isoladamente, R$ 1.000 em 3x davam
    // 3 × 333,33 = 999,99 — um centavo sumia do contrato.
    const parcelas = gerarParcelas(1000, 0, 3, "2026-03-10");
    expect(parcelas.map((p) => p.valor)).toEqual([333.33, 333.33, 333.34]);
    expect(parcelas.reduce((soma, p) => soma + p.valor, 0)).toBeCloseTo(1000, 10);
  });

  it("resto de centavos vai para a última parcela também com juros", () => {
    // valorComJuros = 5000 * (1 + 0.03 * 3.5) = 5525 → 7 × 789,285714…
    const parcelas = gerarParcelas(5000, 3, 7, "2026-03-10");
    expect(parcelas.reduce((soma, p) => soma + p.valor, 0)).toBeCloseTo(5525, 10);
    expect(parcelas[6].valor).toBeGreaterThan(parcelas[0].valor);
  });
});

describe("adicionarMeses", () => {
  it("soma meses preservando o dia quando o mês de destino tem dias suficientes", () => {
    expect(adicionarMeses("2026-08-28", 1)).toBe("2026-09-28");
    expect(adicionarMeses("2026-08-28", 5)).toBe("2027-01-28");
  });

  it("transborda pro mês seguinte quando o dia não existe no mês de destino (rollover nativo de Date)", () => {
    expect(adicionarMeses("2026-01-31", 1)).toBe("2026-03-03");
  });
});
