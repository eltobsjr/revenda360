import { describe, it, expect } from "vitest";
import { calcularValoresBaixa } from "./baixa-valores";

const CONFIG = { multaPct: 2, moraPctDia: 0.1 };

describe("calcularValoresBaixa", () => {
  it("parcela em dia e sem desconto: recebe o valor cheio", () => {
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 0, diasAtraso: 0, desconto: 0, ...CONFIG });
    expect(r.juros).toBe(0);
    expect(r.descontoEfetivo).toBe(0);
    expect(r.valorPagoTotal).toBe(1000);
  });

  it("parcela atrasada soma juros + multa sobre o saldo", () => {
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 0, diasAtraso: 20, desconto: 0, ...CONFIG });
    expect(r.juros).toBeCloseTo(1000 * 0.02 + 1000 * 0.001 * 20, 6);
    expect(r.valorPagoTotal).toBeCloseTo(1000 + r.juros, 6);
  });

  it("limita o desconto ao total devido, sem gravar número exagerado", () => {
    const r = calcularValoresBaixa({ valor: 500, valorPago: 0, diasAtraso: 0, desconto: 10000, ...CONFIG });
    expect(r.descontoEfetivo).toBe(500);
    expect(r.valorPagoTotal).toBe(0);
  });

  it("parcela com pagamento parcial: juros incidem só sobre o saldo em aberto", () => {
    // 1000 com 400 já pagos → saldo 600. Cobrar juros sobre os 1000
    // cobraria de novo encargo de dinheiro que o cliente já entregou.
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 400, diasAtraso: 20, desconto: 0, ...CONFIG });
    expect(r.juros).toBeCloseTo(600 * 0.02 + 600 * 0.001 * 20, 6);
    expect(r.valorPagoTotal).toBeCloseTo(1000 + r.juros, 6);
  });

  it("valor_pago gravado é acumulado, não substituído (não apaga o que já entrou)", () => {
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 400, diasAtraso: 0, desconto: 0, ...CONFIG });
    expect(r.valorPagoTotal).toBe(1000);
  });

  it("desconto numa parcela parcial não pode passar do saldo devedor", () => {
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 400, diasAtraso: 0, desconto: 900, ...CONFIG });
    expect(r.descontoEfetivo).toBe(600);
    expect(r.valorPagoTotal).toBe(400);
  });

  it("parcela já quitada por excesso não gera saldo negativo", () => {
    const r = calcularValoresBaixa({ valor: 1000, valorPago: 1200, diasAtraso: 30, desconto: 0, ...CONFIG });
    expect(r.juros).toBe(0);
    expect(r.valorPagoTotal).toBe(1200);
  });
});
