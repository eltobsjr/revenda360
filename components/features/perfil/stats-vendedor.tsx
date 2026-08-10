import { KpiCard } from "@/components/features/dashboard/kpi-card";
import { formatBRL, formatInt } from "@/lib/format";
import type { EstatisticasVendedor } from "@/lib/data/perfil";
import type { Kpi } from "@/lib/data/dashboard";

export function StatsVendedor({ stats }: { stats: EstatisticasVendedor }) {
  const kpis: Kpi[] = [
    {
      label: "Vendas confirmadas",
      value: formatInt(stats.vendasConfirmadas),
      sub: null,
      tone: "default",
    },
    {
      label: "Faturamento gerado",
      value: formatBRL(stats.faturamentoTotal),
      sub: null,
      tone: "success",
    },
    { label: "Propostas em aberto", value: formatInt(stats.propostasEmAberto), sub: null, tone: "default" },
    { label: "Leads em carteira", value: formatInt(stats.leadsEmCarteira), sub: null, tone: "default" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
