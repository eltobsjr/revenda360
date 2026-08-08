import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve o `token_hash` de recovery gerado por `gerarLinkDefinirSenha`,
 * estabelecendo a sessão do usuário — equivalente ao link que o Supabase
 * mandaria por e-mail, mas resolvido localmente porque o projeto não tem
 * SMTP configurado.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/";
  // Só aceita path interno (nunca URL absoluta nem protocol-relative "//"),
  // pra esse redirect não virar um open redirect a partir de um link de
  // recovery sensível.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
}
