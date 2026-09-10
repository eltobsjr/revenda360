import { describe, it, expect } from "vitest";
import { parseValorBRL } from "./dinheiro";

describe("parseValorBRL", () => {
  it("aceita inteiro simples", () => {
    expect(parseValorBRL("100")).toBe(100);
  });

  it("aceita vírgula como separador decimal", () => {
    expect(parseValorBRL("100,50")).toBe(100.5);
  });

  it("trata ponto como milhar quando há vírgula decimal (bug real: virava 0)", () => {
    // Number("1.500,00".replace(",", ".")) === Number("1.500.00") === NaN,
    // e o `|| 0` da action transformava o desconto digitado em zero sem erro.
    expect(parseValorBRL("1.500,00")).toBe(1500);
    expect(parseValorBRL("2.000,75")).toBe(2000.75);
    expect(parseValorBRL("1.234.567,89")).toBe(1234567.89);
  });

  it("trata ponto como milhar quando agrupa exatamente 3 dígitos (bug real: 1.500 virava 1,5)", () => {
    expect(parseValorBRL("1.500")).toBe(1500);
    expect(parseValorBRL("1.234.567")).toBe(1234567);
  });

  it("trata ponto como decimal quando não agrupa 3 dígitos (digitação en-US)", () => {
    expect(parseValorBRL("1.5")).toBe(1.5);
    expect(parseValorBRL("1.50")).toBe(1.5);
    expect(parseValorBRL("0.99")).toBe(0.99);
  });

  it("ignora prefixo R$ e espaços", () => {
    expect(parseValorBRL("R$ 300")).toBe(300);
    expect(parseValorBRL(" R$ 1.500,00 ")).toBe(1500);
  });

  it("campo vazio vale zero — desconto é opcional", () => {
    expect(parseValorBRL("")).toBe(0);
    expect(parseValorBRL("   ")).toBe(0);
  });

  it("recusa entrada inválida em vez de silenciosamente virar zero", () => {
    expect(parseValorBRL("abc")).toBeNull();
    expect(parseValorBRL("1,2,3")).toBeNull();
    expect(parseValorBRL("-50")).toBeNull();
    expect(parseValorBRL("1.23.4")).toBeNull();
  });
});
