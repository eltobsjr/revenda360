import { requireProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { KpiCard } from "@/components/features/dashboard/kpi-card";
import { ParcelasVencendoCard } from "@/components/features/dashboard/parcelas-vencendo-card";
import { AgingCard } from "@/components/features/dashboard/aging-card";
import { VendasChartCard } from "@/components/features/dashboard/vendas-chart-card";
import { MixTopModelosCard } from "@/components/features/dashboard/mix-top-modelos-card";
import { MovimentacoesCard } from "@/components/features/dashboard/movimentacoes-card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const dados = await getDashboardData(profile.role);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Como está a loja hoje — {dados.hojeFmt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {dados.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <ParcelasVencendoCard parcelas={dados.parcelasVencendo} />
        <AgingCard buckets={dados.agingBuckets} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <VendasChartCard meses={dados.vendas12Meses} mostrarLucro={dados.podeVerFinanceiro} />
        <MixTopModelosCard
          mixCarroPct={dados.mixCarroPct}
          mixMotoPct={dados.mixMotoPct}
          topModelos={dados.topModelos}
        />
      </div>

      <MovimentacoesCard movimentacoes={dados.movimentacoes} />
    </div>
  );
}
