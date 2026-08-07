import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, formatDataBR } from "@/lib/format";
import { RenegociarDialog } from "./renegociar-dialog";
import type { ContratoRow } from "@/lib/data/contas-receber";

export function ContratosGrid({ contratos }: { contratos: ContratoRow[] }) {
  if (contratos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum contrato de crediário encontrado.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {contratos.map((ct) => (
        <Card key={ct.id}>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-semibold">{ct.cliente}</div>
              <div className="text-xs text-muted-foreground">{ct.veiculo}</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success" style={{ width: `${ct.pctPago}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBRL(ct.totalPago)} pago</span>
              <span>{formatBRL(ct.saldo)} saldo</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Próximo vencimento:{" "}
              <strong className="font-medium text-foreground">
                {ct.proximoVencimento ? formatDataBR(ct.proximoVencimento) : "—"}
              </strong>
            </div>
            {ct.saldo > 0 ? (
              <RenegociarDialog contrato={ct} />
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
