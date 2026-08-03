import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/data/dashboard";

const TONE_CLASSES: Record<Kpi["tone"], string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <div className="text-xs text-muted-foreground">{kpi.label}</div>
        <div className={cn("text-xl font-bold tabular-nums", TONE_CLASSES[kpi.tone])}>
          {kpi.value}
        </div>
        {kpi.sub ? <div className="text-xs text-muted-foreground">{kpi.sub}</div> : null}
      </CardContent>
    </Card>
  );
}
