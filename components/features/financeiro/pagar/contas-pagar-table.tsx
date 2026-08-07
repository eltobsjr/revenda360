import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ContaPagarRow } from "@/lib/data/contas-pagar";
import { ParcelaStatusBadge } from "@/components/features/financeiro/receber/parcela-status-badge";
import { BaixaContaPagarDialog } from "./baixa-conta-pagar-dialog";

export function ContasPagarTable({ contas }: { contas: ContaPagarRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground">{c.categoria ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.fornecedor ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDataBR(c.vencimento)}
                  {c.diasAtraso > 0 ? (
                    <span className="ml-1 text-xs text-destructive">
                      ({c.diasAtraso}d atraso)
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatBRL(c.valor)}</TableCell>
                <TableCell>
                  <ParcelaStatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  {c.podeBaixar ? <BaixaContaPagarDialog conta={c} /> : null}
                </TableCell>
              </TableRow>
            ))}
            {contas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhuma conta a pagar encontrada.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
