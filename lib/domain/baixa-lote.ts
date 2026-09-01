/**
 * Agregação do resultado de uma baixa de parcelas em lote.
 *
 * Baixar N parcelas não é uma operação atômica: cada parcela é validada e
 * atualizada individualmente no banco (status, trava contra baixa dupla), então
 * o lote pode terminar em sucesso parcial. Esta função existe para que esse
 * "parcial" seja sempre reportado — nunca arredondado para "deu certo" só
 * porque alguma parcela passou.
 */

export type ResultadoBaixaParcela = {
  /** Id da parcela, para a tela mapear a falha de volta na linha certa. */
  parcelaId: string;
  /** `null` quando a baixa foi gravada; a mensagem de erro quando não foi. */
  erro: string | null;
};

export type FalhaBaixaLote = {
  parcelaId: string;
  erro: string;
};

export type ResumoBaixaLote = {
  baixadas: number;
  falhas: FalhaBaixaLote[];
  mensagem: string;
};

function plural(qtd: number, singular: string, plural: string): string {
  return qtd === 1 ? singular : plural;
}

export function resumirBaixaLote(resultados: ResultadoBaixaParcela[]): ResumoBaixaLote {
  const falhas: FalhaBaixaLote[] = resultados
    .filter((r): r is ResultadoBaixaParcela & { erro: string } => r.erro !== null)
    .map((r) => ({ parcelaId: r.parcelaId, erro: r.erro }));
  const baixadas = resultados.length - falhas.length;

  return { baixadas, falhas, mensagem: montarMensagem(baixadas, falhas.length) };
}

function montarMensagem(baixadas: number, qtdFalhas: number): string {
  if (baixadas === 0) return "Nenhuma parcela foi baixada.";

  const baixadasTexto = `${baixadas} ${plural(baixadas, "parcela", "parcelas")}`;
  if (qtdFalhas === 0) {
    return `${baixadasTexto} ${plural(baixadas, "baixada", "baixadas")} com sucesso.`;
  }
  return `${baixadasTexto} ${plural(baixadas, "baixada", "baixadas")}. ${qtdFalhas} não ${plural(qtdFalhas, "pôde", "puderam")} ser ${plural(qtdFalhas, "baixada", "baixadas")}.`;
}
