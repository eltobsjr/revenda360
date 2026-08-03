import { Badge } from "@/components/ui/badge";
import type { StatusParcela } from "@/lib/domain/juros";

const STATUS_CLASSES: Record<StatusParcela, string> = {
  "A vencer": "border-info/30 bg-info/10 text-info",
  Paga: "border-success/30 bg-success/10 text-success",
  Atrasada: "border-destructive/30 bg-destructive/10 text-destructive",
  Parcial: "border-warning/30 bg-warning/10 text-warning",
  Renegociada: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function ParcelaStatusBadge({ status }: { status: StatusParcela }) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {status}
    </Badge>
  );
}
