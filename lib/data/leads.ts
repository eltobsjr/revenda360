import { createClient } from "@/lib/supabase/server";
import type { LeadRow } from "@/components/features/leads/types";

export async function listLeads(): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, nome, contato, origem, veiculo_interesse_id, vendedor_id, etapa, observacoes, criado_em")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Falha ao listar leads: ${error.message}`);
  if (!leads || leads.length === 0) return [];

  const veiculoIds = [...new Set(leads.map((l) => l.veiculo_interesse_id).filter((id): id is string => !!id))];
  const vendedorIds = [...new Set(leads.map((l) => l.vendedor_id).filter((id): id is string => !!id))];

  const [veiculosRes, vendedoresRes] = await Promise.all([
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo").in("id", veiculoIds)
      : Promise.resolve({ data: [] as { id: string; marca: string; modelo: string }[], error: null }),
    vendedorIds.length
      ? supabase.from("profiles").select("id, nome").in("id", vendedorIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos de interesse: ${veiculosRes.error.message}`);
  if (vendedoresRes.error) throw new Error(`Falha ao resolver vendedores: ${vendedoresRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, `${v.marca} ${v.modelo}`]));
  const vendedorPorId = new Map((vendedoresRes.data ?? []).map((p) => [p.id, p.nome]));

  return leads.map((l) => ({
    id: l.id,
    nome: l.nome,
    contato: l.contato,
    origem: l.origem,
    veiculoInteresse: l.veiculo_interesse_id ? (veiculoPorId.get(l.veiculo_interesse_id) ?? null) : null,
    vendedor: l.vendedor_id ? (vendedorPorId.get(l.vendedor_id) ?? null) : null,
    etapa: l.etapa,
    observacoes: l.observacoes,
    criadoEm: l.criado_em,
  }));
}
