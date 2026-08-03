import { describe, it, expect } from "vitest";
import { calcularDiasAtraso, calcularJurosMulta, statusEfetivo } from "./juros";

// Valores de referência: contrato "ct1" do protótipo Revenda360.dc.html,
// parcela 5/6 (venc 05/06/2026, valor 2000, status Atrasada), com HOJE
// fixado em 28/07/2026 (mesma data-base usada no restante do domínio).
const HOJE = new Date(2026, 6, 28);

describe("calcularDiasAtraso", () => {
  it("calcula dias corridos entre vencimento e hoje (parcela ct1/5)", () => {
    expect(calcularDiasAtraso("2026-06-05", HOJE)).toBe(53);
  });

  it("retorna 0 quando o vencimento é hoje", () => {
    expect(calcularDiasAtraso("2026-07-28", HOJE)).toBe(0);
  });

  it("nunca retorna negativo para vencimento no futuro", () => {
    expect(calcularDiasAtraso("2026-08-15", HOJE)).toBe(0);
  });
});

describe("calcularJurosMulta", () => {
  it("aplica multa fixa + mora por dia sobre a parcela em atraso (ct1/5)", () => {
    // multaPct=2, moraPctDia=0.1 são os defaults de tenant_config
    // (mesmos valores hardcoded no protótipo: 0.02 e 0.001).
    expect(calcularJurosMulta(2000, 53, 2, 0.1)).toBeCloseTo(2000 * 0.02 + 2000 * 0.001 * 53, 6);
    expect(calcularJurosMulta(2000, 53, 2, 0.1)).toBeCloseTo(146, 6);
  });

  it("sem atraso, não há juros nem multa", () => {
    expect(calcularJurosMulta(2000, 0, 2, 0.1)).toBe(0);
  });
});

describe("statusEfetivo", () => {
  it("mantém 'A vencer' quando o vencimento ainda não passou", () => {
    expect(statusEfetivo("A vencer", "2026-08-15", HOJE)).toBe("A vencer");
  });

  it("deriva 'Atrasada' de 'A vencer' com vencimento no passado, sem persistir no banco", () => {
    expect(statusEfetivo("A vencer", "2026-06-05", HOJE)).toBe("Atrasada");
  });

  it("não altera status que já não é 'A vencer' (Paga, Parcial, Renegociada)", () => {
    expect(statusEfetivo("Paga", "2026-06-05", HOJE)).toBe("Paga");
    expect(statusEfetivo("Parcial", "2026-06-05", HOJE)).toBe("Parcial");
    expect(statusEfetivo("Renegociada", "2026-06-05", HOJE)).toBe("Renegociada");
  });
});
