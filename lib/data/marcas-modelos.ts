import { createClient } from "@/lib/supabase/server";

export type ModeloRow = { id: string; nome: string; ativo: boolean };
export type MarcaComModelos = { id: string; nome: string; ativo: boolean; modelos: ModeloRow[] };

export async function listMarcasComModelos(): Promise<MarcaComModelos[]> {
  const supabase = await createClient();
  const [marcasRes, modelosRes] = await Promise.all([
    supabase.from("marcas").select("id, nome, ativo").order("nome"),
    supabase.from("modelos").select("id, marca_id, nome, ativo").order("nome"),
  ]);
  if (marcasRes.error) throw new Error(`Falha ao listar marcas: ${marcasRes.error.message}`);
  if (modelosRes.error) throw new Error(`Falha ao listar modelos: ${modelosRes.error.message}`);

  const modelosPorMarca = new Map<string, ModeloRow[]>();
  for (const m of modelosRes.data ?? []) {
    const lista = modelosPorMarca.get(m.marca_id) ?? [];
    lista.push({ id: m.id, nome: m.nome, ativo: m.ativo });
    modelosPorMarca.set(m.marca_id, lista);
  }

  return (marcasRes.data ?? []).map((m) => ({
    id: m.id,
    nome: m.nome,
    ativo: m.ativo,
    modelos: modelosPorMarca.get(m.id) ?? [],
  }));
}

/**
 * Só marcas/modelos ativos, pra popular o select da Entrada de veículo
 * (Fase 2, já em produção). `marcas`/`modelos` são tabelas novas (migration
 * 0013) — erro aqui degrada pra lista vazia em vez de quebrar o cadastro de
 * veículo normal, que não depende disso.
 */
export async function listMarcasComModelosAtivos(): Promise<MarcaComModelos[]> {
  try {
    const todas = await listMarcasComModelos();
    return todas
      .filter((m) => m.ativo)
      .map((m) => ({ ...m, modelos: m.modelos.filter((mo) => mo.ativo) }));
  } catch {
    return [];
  }
}
