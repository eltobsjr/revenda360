import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type ClienteListado = {
  id: string;
  nome: string;
  /** Ausente quando o papel do usuário não é gestor (CPF é dado sensível filtrado em `lib/data/clientes.ts`). */
  cpf?: string | null;
  whatsapp: string | null;
  email: string | null;
  cidade: string | null;
  criado_em: string;
};

/**
 * CPF é dado pessoal sensível (regra suprema do CLAUDE.md): só retorna para
 * `gestor`. A busca continua aceitando CPF como termo (útil pra localizar um
 * cliente que o vendedor já tem na mão), só o valor não volta na resposta.
 */
export async function listClientes(role: UserRole, busca?: string): Promise<ClienteListado[]> {
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
  const clientes = data ?? [];
  if (role === "gestor") return clientes;
  return clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    whatsapp: c.whatsapp,
    email: c.email,
    cidade: c.cidade,
    criado_em: c.criado_em,
  }));
}
