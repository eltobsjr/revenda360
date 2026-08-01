import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const AUTH_ONLY_PATHS = ["/login"];

/**
 * Não há autocadastro: contas são provisionadas pelo dono da plataforma (via
 * painel administrativo, ainda não construído) — todo usuário autenticado
 * deveria ter um profile.
 *
 * Mesmo assim, um JWT válido pode sobreviver a um profile que deixou de
 * existir (usuário removido manualmente, falha parcial no provisionamento).
 * Sem checar isso aqui, esse caso vira loop infinito: middleware manda
 * autenticado para /dashboard, o layout de `(app)` não acha profile e manda
 * de volta para /login, middleware vê "autenticado" de novo e manda para
 * /dashboard... Por isso a sessão é encerrada aqui mesmo quando detectada.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  if (!profile) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
