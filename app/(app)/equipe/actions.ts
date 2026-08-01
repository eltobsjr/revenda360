"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type EquipeState = {
  error: string | null;
  senhaTemporaria: string | null;
  emailCriado: string | null;
};

function gerarSenhaTemporaria() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function criarMembroEquipe(
  _prevState: EquipeState,
  formData: FormData,
): Promise<EquipeState> {
  await requireRole(["gestor"]);

  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "") as UserRole;
  const lojaId = String(formData.get("lojaId") || "") || null;

  if (!nome || !email) {
    return { error: "Informe nome e e-mail.", senhaTemporaria: null, emailCriado: null };
  }
  if (!["vendedor", "financeiro", "gestor"].includes(role)) {
    return { error: "Papel inválido.", senhaTemporaria: null, emailCriado: null };
  }

  const senha = gerarSenhaTemporaria();
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return {
      error:
        createError?.code === "email_exists"
          ? "Este e-mail já está em uso."
          : "Não foi possível criar o usuário.",
      senhaTemporaria: null,
      emailCriado: null,
    };
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase.rpc("criar_membro_equipe", {
    p_user_id: created.user.id,
    p_nome: nome,
    p_role: role,
    p_loja_id: lojaId,
  });

  if (profileError) {
    return {
      error: "Usuário criado, mas houve falha ao vincular o perfil. Contate o suporte.",
      senhaTemporaria: null,
      emailCriado: null,
    };
  }

  revalidatePath("/equipe");
  return { error: null, senhaTemporaria: senha, emailCriado: email };
}
