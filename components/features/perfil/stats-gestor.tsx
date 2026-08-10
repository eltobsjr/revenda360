import { KpiCard } from "@/components/features/dashboard/kpi-card";
import { formatInt } from "@/lib/format";
import type { EstatisticasGestor } from "@/lib/data/perfil";
import type { Kpi } from "@/lib/data/dashboard";

export function StatsGestor({ stats }: { stats: EstatisticasGestor }) {
  const kpis: Kpi[] = [
    { label: "Lojas ativas", value: formatInt(stats.qtdLojas), sub: null, tone: "default" },
    { label: "Membros ativos na equipe", value: formatInt(stats.qtdMembrosAtivos), sub: null, tone: "default" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  );
}
