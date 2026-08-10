import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const AUTH_ONLY_PATHS = ["/login"];

/**
 * Não há autocadastro: contas de tenant são provisionadas pelo dono da
 * plataforma via painel administrativo (`/admin`) — todo usuário
 * autenticado que não for o próprio dono da plataforma deveria ter um
 * profile.
 *
 * O dono da plataforma é a exceção: ele nunca tem linha em `profiles` (não
 * pertence a tenant nenhum), sua identidade é a allowlist
 * `platform_admins`, checada via `is_platform_admin()`. Por isso, ao
 * encontrar um usuário autenticado sem profile, o middleware precisa
 * distinguir "dono da plataforma" (manda para /admin) de "JWT órfão"
 * (profile deletado/nunca criado — sem essa checagem, esse segundo caso
 * vira loop infinito: middleware manda autenticado para /dashboard, o
 * layout de `(app)` não acha profile e manda de volta para /login,
 * middleware vê "autenticado" de novo... por isso a sessão é encerrada
 * aqui mesmo quando detectada).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // `/auth/confirm` resolve o token de "definir senha" e troca a sessão pra
  // quem está no link — precisa rodar mesmo se o navegador já tiver uma
  // sessão de outra conta (ex.: o gestor testando o link que acabou de
  // gerar), senão o redirect de "já autenticado" abaixo intercepta antes do
  // handler trocar a sessão. `startsWith` também cobre `/auth/confirmar` (o
  // interstitial antes dele, ver gerarLinkDefinirSenha) de propósito: quem
  // ainda não logou precisa conseguir abrir essa página sem ser jogado pro
  // /login por "não autenticado".
  if (request.nextUrl.pathname.startsWith("/auth/confirm")) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (!userId) {
    if (isAuthOnlyPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    if (pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    if (isAuthOnlyPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
