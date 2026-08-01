import { createClient } from "@/lib/supabase/server";

export async function getTenantConfig() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_config")
    .select("multa_pct, mora_pct_dia, margem_minima_pct_default, dias_alerta_estoque_parado")
    .single();

  if (error) throw new Error(`Falha ao buscar configuração do tenant: ${error.message}`);
  return data;
}
