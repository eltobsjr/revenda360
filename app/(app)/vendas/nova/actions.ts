"use server";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fecharVendaSchema } from "@/lib/validation/venda.schema";

export type FecharVendaResultado = {
  vendaId: string | null;
  error: string | null;
};

export async function fecharVenda(input: unknown): Promise<FecharVendaResultado> {
  await requireProfile();

  const parsed = fecharVendaSchema.safeParse(input);
  if (!parsed.success) {
    return { vendaId: null, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fechar_venda", {
    payload: parsed.data,
  });

  if (error) {
    return { vendaId: null, error: "Não foi possível concluir a venda. " + error.message };
  }

  return { vendaId: data, error: null };
}
