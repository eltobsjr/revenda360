"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { gerarLinkDefinirSenha } from "@/lib/auth/definir-senha";

export type RevendaState = {
  error: string | null;
  linkDefinirSenha: string | null;
  emailCriado: string | null;
};

export async function criarRevenda(
  _prevState: RevendaState,
  formData: FormData,
): Promise<RevendaState> {
  await requirePlatformAdmin();

  const nomeRevenda = String(formData.get("nomeRevenda") || "").trim();
  const nomeGestor = String(formData.get("nomeGestor") || "").trim();
  const emailGestor = String(formData.get("emailGestor") || "").trim();
  const nomeLoja = String(formData.get("nomeLoja") || "").trim();
  const cidadeLoja = String(formData.get("cidadeLoja") || "").trim() || null;
  const ufLoja = String(formData.get("ufLoja") || "").trim() || null;

  if (!nomeRevenda || !nomeGestor || !emailGestor || !nomeLoja) {
    return {
      error: "Informe nome da revenda, nome e e-mail do gestor e nome da loja.",
      linkDefinirSenha: null,
      emailCriado: null,
    };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: emailGestor,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      error:
        createError?.code === "email_exists"
          ? "Este e-mail já está em uso."
          : "Não foi possível criar o usuário.",
      linkDefinirSenha: null,
      emailCriado: null,
    };
  }

  const supabase = await createClient();
  const { error: provisionError } = await supabase.rpc("provisionar_revenda", {
    p_user_id: created.user.id,
    p_nome_revenda: nomeRevenda,
    p_nome_usuario: nomeGestor,
    p_loja_nome: nomeLoja,
    p_loja_cidade: cidadeLoja,
    p_loja_uf: ufLoja,
  });

  if (provisionError) {
    return {
      error: "Usuário criado, mas houve falha ao provisionar a revenda. Contate o suporte.",
      linkDefinirSenha: null,
      emailCriado: null,
    };
  }

  const link = await gerarLinkDefinirSenha(admin, emailGestor);
  if (!link) {
    return {
      error: "Revenda criada, mas houve falha ao gerar o link de definir senha. Contate o suporte.",
      linkDefinirSenha: null,
      emailCriado: null,
    };
  }

  revalidatePath("/admin");
  return { error: null, linkDefinirSenha: link, emailCriado: emailGestor };
}
