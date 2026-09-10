import { Card, CardContent } from "@/components/ui/card";
import { ContratoCard } from "./contrato-card";
import type { ContratoRow, ParcelaRow } from "@/lib/data/contas-receber";

export function ContratosGrid({
  contratos,
  parcelas,
  multaPct,
  moraPctDia,
  podeDarBaixa,
}: {
  contratos: ContratoRow[];
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
  podeDarBaixa: boolean;
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

  // Carnê completo por contrato — pagas incluídas. O card precisa mostrar as
  // 24 parcelas, não só as em aberto: quem cobra precisa ver o que já foi
  // pago tanto quanto o que falta.
  const parcelasPorContrato = new Map<string, ParcelaRow[]>();
  for (const p of parcelas) {
    const lista = parcelasPorContrato.get(p.contratoId) ?? [];
    lista.push(p);
    parcelasPorContrato.set(p.contratoId, lista);
  }
  for (const lista of parcelasPorContrato.values()) {
    lista.sort((a, b) => a.numero - b.numero);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {contratos.map((ct) => (
        <ContratoCard
          key={ct.id}
          contrato={ct}
          parcelas={parcelasPorContrato.get(ct.id) ?? []}
          multaPct={multaPct}
          moraPctDia={moraPctDia}
          podeDarBaixa={podeDarBaixa}
        />
      ))}
    </div>
  );
}
