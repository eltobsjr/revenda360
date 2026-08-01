import { createClient } from "@/lib/supabase/server";

export async function listClientes(busca?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("clientes")
    .select("id, nome, cpf, whatsapp, email, cidade, criado_em")
    .order("nome");

  if (busca) {
    // Remove caracteres com significado especial na sintaxe de filtro do
    // PostgREST (`,`, `(`, `)`) para não quebrar o `.or()` nem permitir que o
    // termo de busca componha condições fora da intenção da query.
    const termo = busca.trim().replace(/[,()]/g, "");
    if (termo) {
      query = query.or(`nome.ilike.%${termo}%,cpf.ilike.%${termo}%`);
    }
  }

  const { data } = await query;
  return data ?? [];
}
