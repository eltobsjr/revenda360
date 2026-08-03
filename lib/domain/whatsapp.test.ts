import { describe, it, expect } from "vitest";
import { linkCobrancaWhatsapp } from "./whatsapp";

describe("linkCobrancaWhatsapp", () => {
  it("normaliza número formatado (com DDD) prefixando o código do país", () => {
    const link = linkCobrancaWhatsapp("(11) 98888-7777", "Olá!");
    expect(link).toBe("https://wa.me/5511988887777?text=Ol%C3%A1!");
  });

  it("não duplica o código do país quando já informado", () => {
    const link = linkCobrancaWhatsapp("+55 11 98888-7777", "Olá!");
    expect(link).toBe("https://wa.me/5511988887777?text=Ol%C3%A1!");
  });

  it("codifica a mensagem na query string", () => {
    const link = linkCobrancaWhatsapp("11988887777", "Parcela em atraso: R$ 100,00");
    expect(link).toContain(encodeURIComponent("Parcela em atraso: R$ 100,00"));
  });
});
