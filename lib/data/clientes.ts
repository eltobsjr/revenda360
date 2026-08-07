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

/** Um cliente específico, para a ficha (Fase 10). CPF ausente fora do papel de gestor, mesmo critério de `listClientes`. */
export async function getCliente(id: string, role: UserRole): Promise<ClienteListado | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, cpf, whatsapp, email, cidade, criado_em")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar cliente: ${error.message}`);
  if (!data) return null;
  if (role === "gestor") return data;
  return {
    id: data.id,
    nome: data.nome,
    whatsapp: data.whatsapp,
    email: data.email,
    cidade: data.cidade,
    criado_em: data.criado_em,
  };
}
