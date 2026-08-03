import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ParcelaRow } from "@/lib/data/contas-receber";
import { ParcelaStatusBadge } from "./parcela-status-badge";
import { BaixaParcelaDialog } from "./baixa-parcela-dialog";

export function ParcelasTable({
  parcelas,
  multaPct,
  moraPctDia,
}: {
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
}) {
  const totalValor = parcelas.reduce((soma, p) => soma + p.valor, 0);
  const totalPago = parcelas.reduce((soma, p) => soma + p.valorPago, 0);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelas.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.cliente}</TableCell>
                <TableCell className="text-muted-foreground">{p.veiculo}</TableCell>
                <TableCell>
                  {p.numero}/{p.totalParcelas}
                </TableCell>
                <TableCell>{formatDataBR(p.vencimento)}</TableCell>
                <TableCell>{formatBRL(p.valor)}</TableCell>
                <TableCell>{formatBRL(p.valorPago)}</TableCell>
                <TableCell>
                  <ParcelaStatusBadge status={p.status} />
                </TableCell>
                <TableCell>
                  {p.podeBaixar ? (
                    <BaixaParcelaDialog
                      parcela={{
                        id: p.id,
                        cliente: p.cliente,
                        veiculo: p.veiculo,
                        numero: p.numero,
                        totalParcelas: p.totalParcelas,
                        vencimento: p.vencimento,
                        valor: p.valor,
                      }}
                      multaPct={multaPct}
                      moraPctDia={moraPctDia}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {parcelas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma parcela encontrada.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
          {parcelas.length > 0 ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Totais</TableCell>
                <TableCell>{formatBRL(totalValor)}</TableCell>
                <TableCell>{formatBRL(totalPago)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </CardContent>
    </Card>
  );
}
