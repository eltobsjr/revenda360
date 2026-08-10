import type { AtualizarNomeState, TrocarSenhaState } from "./actions";

export const ATUALIZAR_NOME_INITIAL_STATE: AtualizarNomeState = {
  error: null,
  sucesso: false,
};

export const TROCAR_SENHA_INITIAL_STATE: TrocarSenhaState = {
  error: null,
  sucesso: false,
};
