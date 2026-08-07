import type { SupabaseClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";
import type { Database } from "@/types/database.types";

/**
 * Gera o link de "definir sua senha" pra um usuário recém-criado (sem senha
 * própria ainda). Usa o `token_hash` do mecanismo de recovery do Supabase
 * diretamente — não o `action_link` hospedado no domínio do Supabase —
 * porque o app resolve a confirmação localmente em `/auth/confirm`, sem
 * depender de envio de e-mail (o projeto não tem SMTP configurado). Quem cria
 * o usuário copia este link e manda manualmente (WhatsApp etc.) — mesmo canal
 * já usado hoje pra senha temporária.
 */
export async function gerarLinkDefinirSenha(
  admin: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error || !data) return null;

  const siteUrl = await getSiteUrl();
  return `${siteUrl}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/definir-senha`;
}
