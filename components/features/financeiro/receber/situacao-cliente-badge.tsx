import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SituacaoCliente } from "@/lib/domain/situacao-cliente";

const SITUACAO_CLASSES: Record<SituacaoCliente, string> = {
  "A vencer": "",
  Pago: "border-success/30 bg-success/10 text-success",
  "Atrasado 1x": "border-warning/30 bg-warning/10 text-warning",
  "Atrasado 2x": "border-destructive/30 bg-destructive/10 text-destructive",
};

export function SituacaoClienteBadge({ situacao }: { situacao: SituacaoCliente }) {
  return (
    <Badge variant="outline" className={cn(SITUACAO_CLASSES[situacao])}>
      {situacao}
    </Badge>
  );
}
