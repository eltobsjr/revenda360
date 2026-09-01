import type { BaixaLoteState, BaixaParcelaState } from "./actions";

export const BAIXA_PARCELA_INITIAL_STATE: BaixaParcelaState = {
  error: null,
  sucesso: false,
};

export const BAIXA_LOTE_INITIAL_STATE: BaixaLoteState = {
  error: null,
  resumo: null,
};
