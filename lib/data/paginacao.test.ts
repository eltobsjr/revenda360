import { describe, it, expect } from "vitest";
import { selecionarTudo, TAMANHO_PAGINA } from "./paginacao";

/** Simula o PostgREST: devolve no máximo TAMANHO_PAGINA linhas por range. */
function bancoFalso(total: number, registro?: [number, number][]) {
  return (de: number, ate: number) => {
    registro?.push([de, ate]);
    const fatia = Array.from({ length: total }, (_, i) => ({ id: i })).slice(de, ate + 1);
    return Promise.resolve({ data: fatia.slice(0, TAMANHO_PAGINA), error: null });
  };
}

describe("selecionarTudo", () => {
  it("traz tudo quando cabe numa página só", async () => {
    const linhas = await selecionarTudo(bancoFalso(42));
    expect(linhas).toHaveLength(42);
  });

  it("traz tudo quando passa do teto do PostgREST (o bug real)", async () => {
    // 3987 parcelas de uma revenda: sem paginação, o app via só 1000 e os
    // contratos das outras 2987 apareciam como "Nenhuma parcela pendente".
    const linhas = await selecionarTudo(bancoFalso(3987));
    expect(linhas).toHaveLength(3987);
    expect(new Set(linhas.map((l) => l.id)).size).toBe(3987);
  });

  it("não perde nem duplica linha na virada de página", async () => {
    const linhas = await selecionarTudo(bancoFalso(TAMANHO_PAGINA * 2));
    expect(linhas.map((l) => l.id)).toEqual(
      Array.from({ length: TAMANHO_PAGINA * 2 }, (_, i) => i),
    );
  });

  it("pede ranges contíguos, sem buraco entre as páginas", async () => {
    const ranges: [number, number][] = [];
    await selecionarTudo(bancoFalso(2500, ranges));
    expect(ranges[0]).toEqual([0, TAMANHO_PAGINA - 1]);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBe(ranges[i - 1][1] + 1);
    }
  });

  it("para na primeira página quando o total é múltiplo exato", async () => {
    const ranges: [number, number][] = [];
    const linhas = await selecionarTudo(bancoFalso(TAMANHO_PAGINA, ranges));
    expect(linhas).toHaveLength(TAMANHO_PAGINA);
    // página cheia → precisa tentar a próxima pra saber que acabou
    expect(ranges).toHaveLength(2);
  });

  it("tabela vazia devolve lista vazia", async () => {
    expect(await selecionarTudo(bancoFalso(0))).toEqual([]);
  });

  it("propaga erro do banco em vez de devolver lista parcial", async () => {
    const consulta = () => Promise.resolve({ data: null, error: { message: "boom" } });
    await expect(selecionarTudo(consulta)).rejects.toThrow("boom");
  });

  it("erro na segunda página também estoura, nunca devolve meia lista", async () => {
    let chamada = 0;
    const consulta = () => {
      chamada++;
      if (chamada === 1) {
        return Promise.resolve({
          data: Array.from({ length: TAMANHO_PAGINA }, (_, i) => ({ id: i })),
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: { message: "falhou na pagina 2" } });
    };
    await expect(selecionarTudo(consulta)).rejects.toThrow("falhou na pagina 2");
  });
});
