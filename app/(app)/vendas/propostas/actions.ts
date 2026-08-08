"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { StatusProposta } from "@/types/database.types";

export type PropostaState = {
  error: string | null;
  sucesso: boolean;
};

export async function criarProposta(
  _prevState: PropostaState,
  formData: FormData,
): Promise<PropostaState> {
  const profile = await requireProfile();
  const veiculoId = String(formData.get("veiculoId") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");
  const clienteNomeAvulso = String(formData.get("clienteNomeAvulso") ?? "").trim();
  const valorProposto = Number(String(formData.get("valorProposto") ?? "0").replace(",", ".")) || 0;
  const condicoes = String(formData.get("condicoes") ?? "").trim();
  const validade = String(formData.get("validade") ?? "").trim();

  if (!veiculoId) return { error: "Escolha um veículo.", sucesso: false };
  if (!clienteId && !clienteNomeAvulso) {
    return { error: "Escolha um cliente cadastrado ou informe o nome.", sucesso: false };
  }
  if (valorProposto <= 0) return { error: "Informe um valor de proposta maior que zero.", sucesso: false };

  const supabase = await createClient();
  const { error } = await supabase.from("propostas").insert({
    tenant_id: profile.tenantId,
    veiculo_id: veiculoId,
    cliente_id: clienteId || null,
    cliente_nome_avulso: clienteId ? null : clienteNomeAvulso,
    valor_proposto: valorProposto,
    condicoes: condicoes || null,
    validade: validade || null,
    vendedor_id: profile.id,
  });
  if (error) return { error: "Não foi possível cadastrar a proposta.", sucesso: false };

  revalidatePath("/vendas/propostas");
  return { error: null, sucesso: true };
}

export async function atualizarStatusProposta(
  propostaId: string,
  status: StatusProposta,
): Promise<{ error: string | null }> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("propostas")
    .update({ status })
    .eq("id", propostaId)
    .eq("tenant_id", profile.tenantId);
  if (error) return { error: "Não foi possível atualizar a proposta." };

  revalidatePath("/vendas/propostas");
  return { error: null };
}

/** Reaproveita um cliente já cadastrado com o mesmo whatsapp, ou cria um novo a partir do nome avulso. */
export async function converterPropostaEmVenda(propostaId: string): Promise<{
  error: string | null;
  clienteId: string | null;
  veiculoId: string | null;
  valorProposto: number | null;
}> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: proposta, error: propostaError } = await supabase
    .from("propostas")
    .select("id, veiculo_id, cliente_id, cliente_nome_avulso, valor_proposto")
    .eq("id", propostaId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();
  if (propostaError || !proposta) {
    return { error: "Proposta não encontrada.", clienteId: null, veiculoId: null, valorProposto: null };
  }

  let clienteId = proposta.cliente_id;
  if (!clienteId && proposta.cliente_nome_avulso) {
    const { data: novoCliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({ tenant_id: profile.tenantId, nome: proposta.cliente_nome_avulso })
      .select("id")
      .single();
    if (clienteError || !novoCliente) {
      return {
        error: "Não foi possível criar o cliente a partir da proposta.",
        clienteId: null,
        veiculoId: null,
        valorProposto: null,
      };
    }
    clienteId = novoCliente.id;
  }

  return {
    error: null,
    clienteId,
    veiculoId: proposta.veiculo_id,
    valorProposto: proposta.valor_proposto,
  };
}
