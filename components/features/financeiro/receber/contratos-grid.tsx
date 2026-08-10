import { Card, CardContent } from "@/components/ui/card";
import { ContratoCard } from "./contrato-card";
import type { ContratoRow, ParcelaRow } from "@/lib/data/contas-receber";

export function ContratosGrid({
  contratos,
  parcelas,
  multaPct,
  moraPctDia,
}: {
  contratos: ContratoRow[];
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
}) {
  if (contratos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum contrato de crediário encontrado.
        </CardContent>
      </Card>
    );
  }

  const pendentesPorContrato = new Map<string, ParcelaRow[]>();
  for (const p of parcelas) {
    if (p.status === "Paga") continue;
    const lista = pendentesPorContrato.get(p.contratoId) ?? [];
    lista.push(p);
    pendentesPorContrato.set(p.contratoId, lista);
  }
  for (const lista of pendentesPorContrato.values()) {
    lista.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {contratos.map((ct) => (
        <ContratoCard
          key={ct.id}
          contrato={ct}
          parcelasPendentes={pendentesPorContrato.get(ct.id) ?? []}
          multaPct={multaPct}
          moraPctDia={moraPctDia}
        />
      ))}
    </div>
  );
}
