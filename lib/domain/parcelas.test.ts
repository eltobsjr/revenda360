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
