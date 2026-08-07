import { createClient } from "@/lib/supabase/server";

export type FornecedorRow = {
  id: string;
  nome: string;
  contato: string | null;
  cnpjCpf: string | null;
  observacoes: string | null;
  qtdVeiculos: number;
};

export async function listFornecedores(): Promise<FornecedorRow[]> {
  const supabase = await createClient();
  const { data: fornecedores, error } = await supabase
    .from("fornecedores")
    .select("id, nome, contato, cnpj_cpf, observacoes")
    .order("nome");
  if (error) throw new Error(`Falha ao listar fornecedores: ${error.message}`);
  if (!fornecedores || fornecedores.length === 0) return [];

  const { data: veiculos, error: veiculosError } = await supabase
    .from("veiculos")
    .select("fornecedor_id")
    .not("fornecedor_id", "is", null);
  if (veiculosError) throw new Error(`Falha ao contar veículos por fornecedor: ${veiculosError.message}`);

  const contagemPorFornecedor = new Map<string, number>();
  for (const v of veiculos ?? []) {
    if (!v.fornecedor_id) continue;
    contagemPorFornecedor.set(v.fornecedor_id, (contagemPorFornecedor.get(v.fornecedor_id) ?? 0) + 1);
  }

  return fornecedores.map((f) => ({
    id: f.id,
    nome: f.nome,
    contato: f.contato,
    cnpjCpf: f.cnpj_cpf,
    observacoes: f.observacoes,
    qtdVeiculos: contagemPorFornecedor.get(f.id) ?? 0,
  }));
}

/**
 * Lista mínima (id, nome) pra popular o select da Entrada de veículo (Fase
 * 2, já em produção). `fornecedores` é tabela nova (migration 0012) — erro
 * aqui (ex.: migration ainda não aplicada) degrada pra lista vazia em vez de
 * quebrar o cadastro de veículo normal, que não depende disso.
 */
export async function listFornecedoresOpcoes(): Promise<{ id: string; nome: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fornecedores").select("id, nome").order("nome");
  if (error) return [];
  return data ?? [];
}
