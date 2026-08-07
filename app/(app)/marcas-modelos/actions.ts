"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type MarcaModeloState = {
  error: string | null;
  sucesso: boolean;
};

export async function criarMarca(
  _prevState: MarcaModeloState,
  formData: FormData,
): Promise<MarcaModeloState> {
  const profile = await requireProfile();
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Informe o nome da marca.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("marcas").insert({ tenant_id: profile.tenantId, nome });
  if (error) return { error: "Não foi possível cadastrar a marca.", sucesso: false };

  revalidatePath("/marcas-modelos");
  return { error: null, sucesso: true };
}

export async function atualizarMarca(
  _prevState: MarcaModeloState,
  formData: FormData,
): Promise<MarcaModeloState> {
  await requireProfile();
  const marcaId = String(formData.get("marcaId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const ativo = formData.get("ativo") === "true";
  if (!marcaId) return { error: "Marca inválida.", sucesso: false };
  if (!nome) return { error: "Informe o nome da marca.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("marcas").update({ nome, ativo }).eq("id", marcaId);
  if (error) return { error: "Não foi possível salvar a marca.", sucesso: false };

  revalidatePath("/marcas-modelos");
  return { error: null, sucesso: true };
}

export async function criarModelo(
  _prevState: MarcaModeloState,
  formData: FormData,
): Promise<MarcaModeloState> {
  const profile = await requireProfile();
  const marcaId = String(formData.get("marcaId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!marcaId) return { error: "Marca inválida.", sucesso: false };
  if (!nome) return { error: "Informe o nome do modelo.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("modelos")
    .insert({ tenant_id: profile.tenantId, marca_id: marcaId, nome });
  if (error) return { error: "Não foi possível cadastrar o modelo.", sucesso: false };

  revalidatePath("/marcas-modelos");
  return { error: null, sucesso: true };
}

export async function atualizarModelo(
  _prevState: MarcaModeloState,
  formData: FormData,
): Promise<MarcaModeloState> {
  await requireProfile();
  const modeloId = String(formData.get("modeloId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const ativo = formData.get("ativo") === "true";
  if (!modeloId) return { error: "Modelo inválido.", sucesso: false };
  if (!nome) return { error: "Informe o nome do modelo.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("modelos").update({ nome, ativo }).eq("id", modeloId);
  if (error) return { error: "Não foi possível salvar o modelo.", sucesso: false };

  revalidatePath("/marcas-modelos");
  return { error: null, sucesso: true };
}

/** Criação rápida a partir do assistente de Entrada de veículo (Fase 17) — retorna o registro criado direto. */
export async function criarMarcaRapida(
  nome: string,
): Promise<{ error: string | null; marca: { id: string; nome: string } | null }> {
  const profile = await requireProfile();
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return { error: "Informe o nome.", marca: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marcas")
    .insert({ tenant_id: profile.tenantId, nome: nomeLimpo })
    .select("id, nome")
    .single();
  if (error || !data) return { error: "Não foi possível cadastrar a marca.", marca: null };

  revalidatePath("/marcas-modelos");
  return { error: null, marca: data };
}

export async function criarModeloRapido(
  marcaId: string,
  nome: string,
): Promise<{ error: string | null; modelo: { id: string; nome: string } | null }> {
  const profile = await requireProfile();
  const nomeLimpo = nome.trim();
  if (!marcaId) return { error: "Escolha uma marca primeiro.", modelo: null };
  if (!nomeLimpo) return { error: "Informe o nome.", modelo: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modelos")
    .insert({ tenant_id: profile.tenantId, marca_id: marcaId, nome: nomeLimpo })
    .select("id, nome")
    .single();
  if (error || !data) return { error: "Não foi possível cadastrar o modelo.", modelo: null };

  revalidatePath("/marcas-modelos");
  return { error: null, modelo: data };
}
