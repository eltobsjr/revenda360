import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

const AUTH_ONLY_PATHS = ["/login"];

/**
 * Não há autocadastro: contas são provisionadas pelo dono da plataforma (via
 * painel administrativo, ainda não construído). O gate aqui é só autenticação
 * — se o usuário estiver autenticado mas sem profile (situação anômala, não
 * esperada no fluxo normal de provisionamento), o layout de `(app)` trata
 * isso ao carregar a rota, redirecionando de volta para /login.
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
  const isAuthenticated = Boolean(claims?.claims.sub);
  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));

  if (!isAuthenticated && !isAuthOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthOnlyPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
