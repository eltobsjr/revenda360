import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, formatDataBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ParcelaVencendo } from "@/lib/data/dashboard";

const STATUS_DOT: Record<ParcelaVencendo["status"], string> = {
  "A vencer": "bg-info",
  Paga: "bg-success",
  Atrasada: "bg-destructive",
  Parcial: "bg-warning",
  Renegociada: "bg-muted-foreground",
};

const STATUS_TEXT: Record<ParcelaVencendo["status"], string> = {
  "A vencer": "text-info",
  Paga: "text-success",
  Atrasada: "text-destructive",
  Parcial: "text-warning",
  Renegociada: "text-muted-foreground",
};

export function ParcelasVencendoCard({ parcelas }: { parcelas: ParcelaVencendo[] }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Parcelas vencendo</div>
          <Link href="/financeiro/receber" className="text-xs font-semibold text-primary">
            Ver tudo →
          </Link>
        </div>
        {parcelas.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma parcela em aberto.
          </p>
        ) : (
          parcelas.map((p) => (
            <div
              key={`${p.contratoId}-${p.numero}`}
              className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
            >
              <div className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[p.status])} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {p.cliente} — {p.veiculo}
                </div>
                <div className="text-xs text-muted-foreground">
                  Parcela {p.numero}/{p.totalParcelas} · vence {formatDataBR(p.vencimento)} ·{" "}
                  <span className={cn("font-semibold", STATUS_TEXT[p.status])}>{p.status}</span>
                </div>
              </div>
              <div className="whitespace-nowrap text-sm font-bold tabular-nums">
                {formatBRL(p.saldo)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
