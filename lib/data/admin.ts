import { createClient } from "@/lib/supabase/server";

export async function listTenants() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, nome, plano, criado_em")
    .order("criado_em", { ascending: false });
  return data ?? [];
}
