import { describe, it, expect } from "vitest";
import {
  normalizarBusca,
  casaBusca,
  dentroDoVencimento,
  dentroDoAtraso,
  type FiltroVencimento,
  type FiltroAtraso,
} from "./filtros-receber";

// Hoje fixo: quarta, 10/09/2026. Mês corrente vai de 01/09 a 30/09.
const HOJE = new Date(2026, 8, 10);

describe("normalizarBusca", () => {
  it("baixa a caixa e remove acento", () => {
    expect(normalizarBusca("José AVELÃ")).toBe("jose avela");
  });

  it("colapsa espaço em volta e no meio", () => {
    expect(normalizarBusca("  João   Silva ")).toBe("joao silva");
  });
});

describe("casaBusca", () => {
  it("termo vazio casa com tudo — filtro desligado", () => {
    expect(casaBusca("", ["Carlos Eduardo", "Honda Titan 160"])).toBe(true);
    expect(casaBusca("   ", ["Carlos Eduardo"])).toBe(true);
  });

  it("acha por pedaço do nome do cliente", () => {
    expect(casaBusca("carlos", ["Carlos Eduardo", "Honda Titan 160"])).toBe(true);
    expect(casaBusca("edua", ["Carlos Eduardo", "Honda Titan 160"])).toBe(true);
  });

  it("acha por pedaço do veículo", () => {
    expect(casaBusca("titan", ["Carlos Eduardo", "Honda Titan 160"])).toBe(true);
  });

  it("ignora acento nos dois lados", () => {
    expect(casaBusca("valeria", ["Valéria Cardoso", "Yamaha Factor 150"])).toBe(true);
    expect(casaBusca("valéria", ["Valeria Cardoso", "Yamaha Factor 150"])).toBe(true);
  });

  it("não casa quando o termo não está em campo nenhum", () => {
    expect(casaBusca("fiat", ["Carlos Eduardo", "Honda Titan 160"])).toBe(false);
  });
});

describe("dentroDoVencimento", () => {
  const casos: [FiltroVencimento, string, boolean][] = [
    ["todos", "2020-01-01", true],
    ["todos", "2030-01-01", true],

    ["vencidas", "2026-09-09", true],
    ["vencidas", "2026-09-10", false], // vence hoje não é vencida
    ["vencidas", "2026-09-11", false],

    ["este-mes", "2026-09-01", true],
    ["este-mes", "2026-09-30", true],
    ["este-mes", "2026-08-31", false],
    ["este-mes", "2026-10-01", false],

    ["proximos-30", "2026-09-10", true], // hoje conta
    ["proximos-30", "2026-10-10", true], // limite inclusivo
    ["proximos-30", "2026-10-11", false],
    ["proximos-30", "2026-09-09", false], // já venceu

    ["futuras", "2026-09-11", true],
    ["futuras", "2026-09-10", false], // hoje não é futura
    ["futuras", "2026-09-09", false],
  ];

  for (const [filtro, vencimento, esperado] of casos) {
    it(`${filtro} + ${vencimento} => ${esperado}`, () => {
      expect(dentroDoVencimento(vencimento, filtro, HOJE)).toBe(esperado);
    });
  }
});

describe("dentroDoAtraso", () => {
  const casos: [FiltroAtraso, number, boolean][] = [
    ["todos", 0, true],
    ["todos", 500, true],

    ["1-30", 0, false], // sem atraso não entra em faixa nenhuma
    ["1-30", 1, true],
    ["1-30", 30, true],
    ["1-30", 31, false],

    ["31-60", 31, true],
    ["31-60", 60, true],
    ["31-60", 61, false],

    ["61-90", 61, true],
    ["61-90", 90, true],
    ["61-90", 91, false],

    ["90+", 90, false], // 90 pertence à faixa anterior, sem sobreposição
    ["90+", 91, true],
    ["90+", 365, true],
  ];

  for (const [filtro, dias, esperado] of casos) {
    it(`${filtro} + ${dias} dias => ${esperado}`, () => {
      expect(dentroDoAtraso(dias, filtro)).toBe(esperado);
    });
  }

  it("as faixas cobrem todo atraso sem buraco e sem sobreposição", () => {
    const faixas: FiltroAtraso[] = ["1-30", "31-60", "61-90", "90+"];
    for (let dias = 1; dias <= 200; dias++) {
      const cabem = faixas.filter((f) => dentroDoAtraso(dias, f));
      expect(cabem).toHaveLength(1);
    }
  });
});
