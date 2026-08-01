"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null };

export async function criarTenant(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const nomeRevenda = String(formData.get("nomeRevenda") || "").trim();
  const nomeUsuario = String(formData.get("nomeUsuario") || "").trim();
  const lojaNome = String(formData.get("lojaNome") || "").trim();
  const lojaCidade = String(formData.get("lojaCidade") || "").trim();
  const lojaUf = String(formData.get("lojaUf") || "").trim();

  if (!nomeRevenda || !nomeUsuario || !lojaNome) {
    return { error: "Preencha nome da revenda, seu nome e nome da loja." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("onboarding_criar_tenant", {
    p_nome_revenda: nomeRevenda,
    p_nome_usuario: nomeUsuario,
    p_loja_nome: lojaNome,
    p_loja_cidade: lojaCidade || null,
    p_loja_uf: lojaUf || null,
  });

  if (error) {
    return { error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  redirect("/dashboard");
}
