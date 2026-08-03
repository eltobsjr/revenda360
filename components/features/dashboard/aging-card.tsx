import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import type { AgingBucket } from "@/lib/data/dashboard";

const BUCKET_STYLE: Record<string, { texto: string; barra: string }> = {
  "0–30 dias": { texto: "text-success", barra: "bg-success" },
  "31–60 dias": { texto: "text-info", barra: "bg-info" },
  "61–90 dias": { texto: "text-warning", barra: "bg-warning" },
  "+90 dias": { texto: "text-destructive", barra: "bg-destructive" },
};

export function AgingCard({ buckets }: { buckets: AgingBucket[] }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 text-sm font-semibold">Aging de estoque</div>
        {buckets.map((b) => {
          const style = BUCKET_STYLE[b.label];
          return (
            <div key={b.label} className="mb-3 last:mb-0">
              <div className="mb-1 flex justify-between text-xs">
                <span className={cn("font-medium", style.texto)}>{b.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {b.qtd} veíc · {formatBRL(b.valor)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full", style.barra)}
                  style={{ width: `${Math.min(100, b.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
