"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DefinirSenhaState = {
  error: string | null;
};

export async function definirSenha(
  _prevState: DefinirSenhaState,
  formData: FormData,
): Promise<DefinirSenhaState> {
  const senha = String(formData.get("senha") || "");
  const confirmacao = String(formData.get("confirmacao") || "");

  if (senha.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (senha !== confirmacao) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    return { error: "Não foi possível definir a senha. Tente novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  redirect(profile ? "/dashboard" : "/admin");
}
