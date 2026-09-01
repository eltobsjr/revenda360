import { describe, it, expect } from "vitest";
import { situacaoCliente } from "./situacao-cliente";

describe("situacaoCliente", () => {
  it("'Pago' quando não há saldo pendente e nenhuma parcela em atraso", () => {
    expect(situacaoCliente(0, 0)).toBe("Pago");
  });

  it("'A vencer' quando há saldo pendente mas nenhuma parcela em atraso", () => {
    expect(situacaoCliente(1500, 0)).toBe("A vencer");
  });

  it("'Atrasado 1x' com exatamente uma parcela em atraso", () => {
    expect(situacaoCliente(1500, 1)).toBe("Atrasado 1x");
  });

  it("'Atrasado 2x' com duas ou mais parcelas em atraso", () => {
    expect(situacaoCliente(3000, 2)).toBe("Atrasado 2x");
    expect(situacaoCliente(4500, 5)).toBe("Atrasado 2x");
  });

  it("tolera resíduo de centavos por arredondamento de ponto flutuante como quitado", () => {
    // 3 parcelas de R$ 33,33 pagas com arredondamento pode deixar 0,0000000001
    // de saldo — não pode virar 'A vencer' por causa disso.
    expect(situacaoCliente(0.000000001, 0)).toBe("Pago");
  });
});
