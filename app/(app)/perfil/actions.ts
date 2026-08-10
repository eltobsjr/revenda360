"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AtualizarNomeState = {
  error: string | null;
  sucesso: boolean;
};

export async function atualizarNome(
  _prevState: AtualizarNomeState,
  formData: FormData,
): Promise<AtualizarNomeState> {
  const profile = await requireProfile();
  const nome = String(formData.get("nome") || "").trim();

  if (!nome) {
    return { error: "Informe um nome.", sucesso: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ nome }).eq("id", profile.id);
  if (error) {
    return { error: "Não foi possível atualizar o nome.", sucesso: false };
  }

  revalidatePath("/perfil");
  return { error: null, sucesso: true };
}

export type TrocarSenhaState = {
  error: string | null;
  sucesso: boolean;
};

/**
 * Trocar senha de dentro do app já logado — diferente de
 * `(auth)/definir-senha`, que só existe pro fluxo de convite (link de
 * e-mail) e redireciona pra /dashboard ou /admin no final. Aqui a pessoa já
 * está autenticada e continua na própria página de perfil.
 */
export async function trocarSenha(
  _prevState: TrocarSenhaState,
  formData: FormData,
): Promise<TrocarSenhaState> {
  await requireProfile();

  const senha = String(formData.get("senha") || "");
  const confirmacao = String(formData.get("confirmacao") || "");

  if (senha.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres.", sucesso: false };
  }
  if (senha !== confirmacao) {
    return { error: "As senhas não coincidem.", sucesso: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    return { error: "Não foi possível trocar a senha. Tente novamente.", sucesso: false };
  }

  return { error: null, sucesso: true };
}
