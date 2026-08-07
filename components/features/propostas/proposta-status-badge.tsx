import { Badge } from "@/components/ui/badge";
import type { StatusProposta } from "@/types/database.types";

const STATUS_CLASSES: Record<StatusProposta, string> = {
  "Em aberto": "border-info/30 bg-info/10 text-info",
  Aceita: "border-success/30 bg-success/10 text-success",
  Recusada: "border-destructive/30 bg-destructive/10 text-destructive",
  Expirada: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function PropostaStatusBadge({ status }: { status: StatusProposta }) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {status}
    </Badge>
  );
}
