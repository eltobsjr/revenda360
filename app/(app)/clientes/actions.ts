"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { clienteFormSchema } from "@/lib/validation/cliente.schema";
import type { Database } from "@/types/database.types";

export type ClienteState = {
  error: string | null;
  sucesso: boolean;
};

export async function criarCliente(
  _prevState: ClienteState,
  formData: FormData,
): Promise<ClienteState> {
  const profile = await requireProfile();

  const parsed = clienteFormSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    tenant_id: profile.tenantId,
    nome: parsed.data.nome,
    cpf: parsed.data.cpf || null,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    cidade: parsed.data.cidade || null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe um cliente com esse CPF." : "Não foi possível salvar o cliente.",
      sucesso: false,
    };
  }

  revalidatePath("/clientes");
  return { error: null, sucesso: true };
}

export async function atualizarCliente(
  _prevState: ClienteState,
  formData: FormData,
): Promise<ClienteState> {
  const profile = await requireProfile();
  const clienteId = String(formData.get("clienteId") ?? "");
  if (!clienteId) return { error: "Cliente inválido.", sucesso: false };

  const parsed = clienteFormSchema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }

  const supabase = await createClient();
  const alteracoes: Database["public"]["Tables"]["clientes"]["Update"] = {
    nome: parsed.data.nome,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    cidade: parsed.data.cidade || null,
  };
  // CPF não chega ao formulário fora do papel de gestor (dado sensível) — sem
  // esta checagem, salvar como vendedor apagaria o CPF já cadastrado.
  if (profile.role === "gestor") alteracoes.cpf = parsed.data.cpf || null;

  const { error } = await supabase.from("clientes").update(alteracoes).eq("id", clienteId);

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe um cliente com esse CPF." : "Não foi possível salvar o cliente.",
      sucesso: false,
    };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { error: null, sucesso: true };
}
