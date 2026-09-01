import { describe, it, expect } from "vitest";
import { resumirBaixaLote } from "./baixa-lote";

const ID_A = "11111111-1111-1111-1111-111111111111";
const ID_B = "22222222-2222-2222-2222-222222222222";

describe("resumirBaixaLote", () => {
  it("relata sucesso total quando todas as parcelas foram baixadas", () => {
    const resumo = resumirBaixaLote([
      { parcelaId: ID_A, erro: null },
      { parcelaId: ID_B, erro: null },
    ]);

    expect(resumo.baixadas).toBe(2);
    expect(resumo.falhas).toEqual([]);
    expect(resumo.mensagem).toBe("2 parcelas baixadas com sucesso.");
  });

  it("usa o singular quando só uma parcela foi baixada", () => {
    const resumo = resumirBaixaLote([{ parcelaId: ID_A, erro: null }]);

    expect(resumo.mensagem).toBe("1 parcela baixada com sucesso.");
  });

  it("relata sucesso parcial identificando qual parcela falhou e por quê", () => {
    const resumo = resumirBaixaLote([
      { parcelaId: ID_A, erro: null },
      { parcelaId: ID_B, erro: "Esta parcela já foi baixada." },
    ]);

    expect(resumo.baixadas).toBe(1);
    expect(resumo.falhas).toEqual([{ parcelaId: ID_B, erro: "Esta parcela já foi baixada." }]);
    expect(resumo.mensagem).toBe("1 parcela baixada. 1 não pôde ser baixada.");
  });

  it("relata falha total quando nenhuma parcela foi baixada", () => {
    const resumo = resumirBaixaLote([
      { parcelaId: ID_A, erro: "Parcela não encontrada." },
      { parcelaId: ID_B, erro: "Esta parcela já foi baixada." },
    ]);

    expect(resumo.baixadas).toBe(0);
    expect(resumo.falhas).toHaveLength(2);
    expect(resumo.mensagem).toBe("Nenhuma parcela foi baixada.");
  });

  // Sem isso, uma tela que só olha `falhas.length === 0` trataria um lote vazio
  // como "nada falhou" e fecharia o modal como se tivesse dado certo.
  it("trata lote vazio como falha total, não como sucesso", () => {
    const resumo = resumirBaixaLote([]);

    expect(resumo.baixadas).toBe(0);
    expect(resumo.falhas).toEqual([]);
    expect(resumo.mensagem).toBe("Nenhuma parcela foi baixada.");
  });
});
