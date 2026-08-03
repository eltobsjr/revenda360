import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import type { InadimplenciaRow } from "@/lib/data/contas-receber";

export function InadimplenciaTable({ linhas }: { linhas: InadimplenciaRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Faixa de atraso</TableHead>
              <TableHead>Valor em atraso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((r) => (
              <TableRow key={r.cliente}>
                <TableCell className="font-medium">{r.cliente}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                    {r.faixa}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-destructive">
                  {formatBRL(r.valorEmAtraso)}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Nenhum cliente inadimplente no momento.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
