import { createClient } from "@/lib/supabase/server";

export async function listMembrosEquipe() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nome, role, ativo, loja_id")
    .order("nome");
  return data ?? [];
}

export async function listLojas() {
  const supabase = await createClient();
  const { data } = await supabase.from("lojas").select("id, nome").order("nome");
  return data ?? [];
}
