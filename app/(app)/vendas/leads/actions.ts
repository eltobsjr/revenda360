"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { EtapaLead } from "@/types/database.types";

export type LeadState = {
  error: string | null;
  sucesso: boolean;
};

export async function criarLead(
  _prevState: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const profile = await requireProfile();
  const nome = String(formData.get("nome") ?? "").trim();
  const contato = String(formData.get("contato") ?? "").trim();
  const origem = String(formData.get("origem") ?? "").trim();
  const veiculoInteresseId = String(formData.get("veiculoInteresseId") ?? "");
  if (!nome) return { error: "Informe o nome.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    tenant_id: profile.tenantId,
    nome,
    contato: contato || null,
    origem: origem || null,
    veiculo_interesse_id: veiculoInteresseId || null,
    vendedor_id: profile.id,
  });
  if (error) return { error: "Não foi possível cadastrar o lead.", sucesso: false };

  revalidatePath("/vendas/leads");
  return { error: null, sucesso: true };
}

export async function atualizarEtapaLead(
  leadId: string,
  etapa: EtapaLead,
): Promise<{ error: string | null }> {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ etapa }).eq("id", leadId);
  if (error) return { error: "Não foi possível mover o lead." };

  revalidatePath("/vendas/leads");
  return { error: null };
}

/**
 * Converte um lead em cliente pronto pra virar venda — reaproveita um
 * cliente já cadastrado com o mesmo whatsapp em vez de duplicar, se existir.
 */
export async function converterLeadEmVenda(
  leadId: string,
): Promise<{ error: string | null; clienteId: string | null }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, nome, contato")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return { error: "Lead não encontrado.", clienteId: null };

  let clienteId: string | null = null;
  if (lead.contato) {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("whatsapp", lead.contato)
      .maybeSingle();
    clienteId = existente?.id ?? null;
  }

  if (!clienteId) {
    const { data: novoCliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({ tenant_id: profile.tenantId, nome: lead.nome, whatsapp: lead.contato || null })
      .select("id")
      .single();
    if (clienteError || !novoCliente) {
      return { error: "Não foi possível criar o cliente a partir do lead.", clienteId: null };
    }
    clienteId = novoCliente.id;
  }

  return { error: null, clienteId };
}
