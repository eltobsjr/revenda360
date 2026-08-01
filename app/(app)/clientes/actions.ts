"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { clienteFormSchema } from "@/lib/validation/cliente.schema";

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
