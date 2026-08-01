import { describe, it, expect } from "vitest";
import {
  custoTotal,
  margemR,
  margemPct,
  precoMinimoEfetivo,
  diasEstoque,
  ocultarCamposSensiveis,
} from "./pricing";

// Valores do veículo "m1" (Honda CG 160 Fan) do protótipo Revenda360.dc.html:
// valorCompra 12800, custos 420, valorVenda 15990.
describe("custoTotal", () => {
  it("soma valor de compra + custos lançados", () => {
    expect(custoTotal(12800, [420])).toBe(13220);
  });

  it("soma múltiplos custos", () => {
    expect(custoTotal(58000, [800, 600, 400])).toBe(59800);
  });

  it("sem custos, custo total é só o valor de compra", () => {
    expect(custoTotal(10000, [])).toBe(10000);
  });
});

describe("margemR", () => {
  it("calcula margem em R$ do veículo m1", () => {
    expect(margemR(15990, 13220)).toBe(2770);
  });

  it("margem negativa quando venda abaixo do custo", () => {
    expect(margemR(10000, 13220)).toBe(-3220);
  });
});

describe("margemPct", () => {
  it("calcula margem percentual do veículo m1", () => {
    expect(margemPct(2770, 15990)).toBeCloseTo(17.32, 2);
  });

  it("retorna 0 quando preço de venda é 0 (evita divisão por zero)", () => {
    expect(margemPct(100, 0)).toBe(0);
  });
});

describe("precoMinimoEfetivo", () => {
  const custoTotalVeiculo = 13220;
  const margemMinimaPctDefault = 8;

  it("usa o preço mínimo cadastrado quando existe", () => {
    expect(precoMinimoEfetivo(14000, custoTotalVeiculo, margemMinimaPctDefault)).toBe(14000);
  });

  it("cai no fallback configurável do tenant quando não há preço mínimo cadastrado", () => {
    expect(precoMinimoEfetivo(null, custoTotalVeiculo, margemMinimaPctDefault)).toBeCloseTo(
      13220 * 1.08,
      2,
    );
  });

  it("trata undefined igual a null (sem preço cadastrado)", () => {
    expect(precoMinimoEfetivo(undefined, custoTotalVeiculo, margemMinimaPctDefault)).toBeCloseTo(
      13220 * 1.08,
      2,
    );
  });
});

describe("diasEstoque", () => {
  it("calcula dias corridos entre a entrada e a data de referência", () => {
    const hoje = new Date(2026, 6, 28); // 28/07/2026, mesma data-base do protótipo
    expect(diasEstoque("2026-07-16", hoje)).toBe(12); // veículo m1: diasEstoque 12
  });

  it("nunca retorna negativo (entrada no futuro por erro de digitação)", () => {
    const hoje = new Date(2026, 6, 28);
    expect(diasEstoque("2026-08-01", hoje)).toBe(0);
  });

  it("aceita Date além de string", () => {
    const hoje = new Date(2026, 6, 28);
    const entrada = new Date(2026, 6, 1);
    expect(diasEstoque(entrada, hoje)).toBe(27);
  });
});

describe("ocultarCamposSensiveis", () => {
  const veiculo = {
    id: "m1",
    modelo: "CG 160 Fan",
    preco_minimo: 14000,
    valor_compra: 12800,
    margem_r: 2770,
    margem_pct: 17.32,
    custo_total: 13220,
    preco_venda: 15990,
  };

  it("gestor vê todos os campos", () => {
    expect(ocultarCamposSensiveis(veiculo, "gestor")).toEqual(veiculo);
  });

  it("vendedor não vê preço mínimo, custo, valor de compra ou margem", () => {
    const resultado = ocultarCamposSensiveis(veiculo, "vendedor");
    expect(resultado).not.toHaveProperty("preco_minimo");
    expect(resultado).not.toHaveProperty("valor_compra");
    expect(resultado).not.toHaveProperty("margem_r");
    expect(resultado).not.toHaveProperty("margem_pct");
    expect(resultado).not.toHaveProperty("custo_total");
    expect(resultado.preco_venda).toBe(15990);
    expect(resultado.modelo).toBe("CG 160 Fan");
  });

  it("financeiro também não vê campos sensíveis", () => {
    const resultado = ocultarCamposSensiveis(veiculo, "financeiro");
    expect(resultado).not.toHaveProperty("margem_r");
  });
});
