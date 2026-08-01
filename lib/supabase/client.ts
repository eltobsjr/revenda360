import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/** Client para uso em Client Components (ex.: upload de foto com progresso). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
