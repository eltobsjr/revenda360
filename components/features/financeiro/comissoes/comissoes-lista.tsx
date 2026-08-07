import { formatBRL, formatDataBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComissaoVendedor } from "@/lib/data/comissoes";
import { MarcarPagaButton } from "./marcar-paga-button";

export function ComissoesLista({ comissoes }: { comissoes: ComissaoVendedor[] }) {
  if (comissoes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="font-medium">Nenhuma venda confirmada no período</p>
          <p className="text-sm text-muted-foreground">Ajuste o filtro de mês.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comissoes.map((c) => (
        <Card key={c.vendedorId}>
          <CardContent className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                <span className="font-medium">{c.vendedor}</span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Pago: <strong className="text-success">{formatBRL(c.totalPago)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Pendente: <strong className="text-warning">{formatBRL(c.totalPendente)}</strong>
                  </span>
                </span>
              </summary>
              <div className="flex flex-col gap-2 border-t p-4">
                {c.vendas.map((v) => (
                  <div
                    key={v.vendaId}
                    className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <div>
                      <span className="font-medium">{v.veiculo}</span>
                      <span className="text-muted-foreground"> — {v.cliente}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDataBR(v.dataVenda)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-medium">{formatBRL(v.comissaoValor)}</span>
                      {v.comissaoPaga ? (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                          Paga
                        </Badge>
                      ) : (
                        <MarcarPagaButton vendaId={v.vendaId} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
