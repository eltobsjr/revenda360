import { Card, CardContent } from "@/components/ui/card";

const CHART_W = 720;
const CHART_H = 170;
const GAP = 8;

export function VendasChartCard({
  meses,
  mostrarLucro,
}: {
  meses: { label: string; faturamento: number; lucro: number }[];
  mostrarLucro: boolean;
}) {
  const n = meses.length || 1;
  const maxFat = Math.max(1, ...meses.map((m) => m.faturamento));
  const barW = CHART_W / n - GAP;

  const barras = meses.map((m, i) => {
    const h = (m.faturamento / maxFat) * (CHART_H - 20);
    return { x: i * (CHART_W / n) + GAP / 2, y: CHART_H - h, w: barW, h };
  });

  const pontos = meses.map((m, i) => ({
    x: i * (CHART_W / n) + CHART_W / n / 2,
    y: CHART_H - (m.lucro / maxFat) * (CHART_H - 20) - 4,
  }));
  const linhaLucro = pontos.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <div className="text-sm font-semibold">Vendas — últimos 12 meses</div>
          <div className="ml-auto flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 border border-info bg-info/20" />
              Faturamento
            </span>
            {mostrarLucro ? (
              <span className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-success" />
                Lucro
              </span>
            ) : null}
          </div>
        </div>
        <svg
          width="100%"
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de faturamento e lucro dos últimos 12 meses"
        >
          {barras.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              className="fill-info/20 stroke-info"
              strokeWidth={1}
            />
          ))}
          {mostrarLucro ? (
            <>
              <polyline
                points={linhaLucro}
                fill="none"
                className="stroke-success"
                strokeWidth={2.5}
              />
              {pontos.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-success" />
              ))}
            </>
          ) : null}
        </svg>
        <div className="mt-1 flex">
          {meses.map((m) => (
            <div key={m.label} className="flex-1 text-center text-[10px] text-muted-foreground">
              {m.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
