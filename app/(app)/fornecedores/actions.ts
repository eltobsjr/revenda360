"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type FornecedorState = {
  error: string | null;
  sucesso: boolean;
};

function parseFornecedorForm(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    contato: String(formData.get("contato") ?? "").trim(),
    cnpjCpf: String(formData.get("cnpjCpf") ?? "").trim(),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
  };
}

export async function criarFornecedor(
  _prevState: FornecedorState,
  formData: FormData,
): Promise<FornecedorState> {
  const profile = await requireProfile();
  const dados = parseFornecedorForm(formData);
  if (!dados.nome) return { error: "Informe o nome.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").insert({
    tenant_id: profile.tenantId,
    nome: dados.nome,
    contato: dados.contato || null,
    cnpj_cpf: dados.cnpjCpf || null,
    observacoes: dados.observacoes || null,
  });
  if (error) return { error: "Não foi possível cadastrar o fornecedor.", sucesso: false };

  revalidatePath("/fornecedores");
  return { error: null, sucesso: true };
}

export async function atualizarFornecedor(
  _prevState: FornecedorState,
  formData: FormData,
): Promise<FornecedorState> {
  await requireProfile();
  const fornecedorId = String(formData.get("fornecedorId") ?? "");
  if (!fornecedorId) return { error: "Fornecedor inválido.", sucesso: false };

  const dados = parseFornecedorForm(formData);
  if (!dados.nome) return { error: "Informe o nome.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update({
      nome: dados.nome,
      contato: dados.contato || null,
      cnpj_cpf: dados.cnpjCpf || null,
      observacoes: dados.observacoes || null,
    })
    .eq("id", fornecedorId);
  if (error) return { error: "Não foi possível salvar o fornecedor.", sucesso: false };

  revalidatePath("/fornecedores");
  return { error: null, sucesso: true };
}

/** Criação rápida a partir do assistente de Entrada de veículo (Fase 16) — retorna o registro criado direto, sem passar por useActionState. */
export async function criarFornecedorRapido(input: {
  nome: string;
  contato?: string;
}): Promise<{ error: string | null; fornecedor: { id: string; nome: string } | null }> {
  const profile = await requireProfile();
  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome.", fornecedor: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .insert({ tenant_id: profile.tenantId, nome, contato: input.contato?.trim() || null })
    .select("id, nome")
    .single();
  if (error || !data) return { error: "Não foi possível cadastrar o fornecedor.", fornecedor: null };

  revalidatePath("/fornecedores");
  return { error: null, fornecedor: data };
}
