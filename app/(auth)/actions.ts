"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  message: string | null;
};

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha.", message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos.", message: null };
  }

  // O redirect de uma Server Action navega no client via RSC — não repassa
  // pelo middleware da mesma forma que uma navegação normal, então quem
  // decide o destino certo (onboarding pendente ou não) é a própria action.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile ? "/dashboard" : "/onboarding");
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmacao = String(formData.get("confirmacao") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha.", message: null };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres.", message: null };
  }
  if (password !== confirmacao) {
    return { error: "As senhas não conferem.", message: null };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  });

  if (error) {
    const msg =
      error.code === "user_already_exists"
        ? "Este e-mail já está cadastrado."
        : "Não foi possível criar a conta. Tente novamente.";
    return { error: msg, message: null };
  }

  if (!data.session) {
    return {
      error: null,
      message: "Enviamos um link de confirmação para o seu e-mail.",
    };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
