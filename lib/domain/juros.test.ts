import { describe, it, expect } from "vitest";
import { calcularDiasAtraso, calcularJurosMulta, statusEfetivo, totalComJurosMulta } from "./juros";

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

  it("vencimento hoje continua 0, mesmo rodando à tarde (bug real encontrado em QA manual)", () => {
    // Sem normalizar `hoje` para meia-noite, a fração de dia decorrida desde
    // 00h de hoje (aqui, 15h30) arredondava pra cima e contava como 1 dia
    // de atraso numa parcela que vence hoje mesmo.
    const hojeATarde = new Date(2026, 6, 28, 15, 30);
    expect(calcularDiasAtraso("2026-07-28", hojeATarde)).toBe(0);
  });

  it("vencimento há exatos 30 dias continua 30, rodando à tarde", () => {
    const hojeATarde = new Date(2026, 6, 28, 15, 30);
    expect(calcularDiasAtraso("2026-06-28", hojeATarde)).toBe(30);
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

describe("totalComJurosMulta", () => {
  it("soma valor + juros de cada parcela", () => {
    // 1000 sem atraso (sem acréscimo) + 500 com 10 dias:
    // multa 2% = 10, mora 0,1%/dia x 10 dias = 5 --> 515
    expect(
      totalComJurosMulta(
        [
          { valor: 1000, diasAtraso: 0 },
          { valor: 500, diasAtraso: 10 },
        ],
        2,
        0.1,
      ),
    ).toBeCloseTo(1000 + 515, 2);
  });

  it("é zero para lista vazia", () => {
    expect(totalComJurosMulta([], 2, 0.1)).toBe(0);
  });
});
