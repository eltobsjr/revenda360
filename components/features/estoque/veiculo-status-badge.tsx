import { Badge } from "@/components/ui/badge";
import type { StatusVeiculo } from "@/types/database.types";

const STATUS_CLASSES: Record<StatusVeiculo, string> = {
  Disponível: "border-success/30 bg-success/10 text-success",
  "Em preparação": "border-info/30 bg-info/10 text-info",
  Reservado: "border-warning/30 bg-warning/10 text-warning",
  Vendido: "border-muted-foreground/20 bg-muted text-muted-foreground",
  Consignado: "border-info/30 bg-info/10 text-info",
  Repasse: "border-warning/30 bg-warning/10 text-warning",
  Devolvido: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function VeiculoStatusBadge({ status }: { status: StatusVeiculo }) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {status}
    </Badge>
  );
}
