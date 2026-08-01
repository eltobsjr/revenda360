import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Client autenticado como o usuário da requisição atual (respeita RLS).
 * Use em Server Components, Server Actions e Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de um Server Component (sem permissão de escrever
            // cookies) — o middleware garante o refresh de sessão nesse caso.
          }
        },
      },
    },
  );
}

/**
 * Client com a service role key — ignora RLS por completo. Só usar em
 * operações server-side explicitamente privilegiadas (ex.: criar usuário via
 * Admin API na tela de Equipe). Nunca expor ao client, nunca usar por padrão.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Client administrativo não participa de sessão de cookie.
        },
      },
    },
  );
}
