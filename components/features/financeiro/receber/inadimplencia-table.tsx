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
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { linkCobrancaWhatsapp } from "@/lib/domain/whatsapp";
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
              <TableHead />
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
                <TableCell>
                  {r.whatsapp ? (
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={
                        <a
                          href={linkCobrancaWhatsapp(
                            r.whatsapp,
                            `Olá, ${r.cliente}! Identificamos um valor em atraso de ${formatBRL(r.valorEmAtraso)} referente ao seu contrato conosco. Podemos combinar o pagamento?`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <MessageCircle className="size-3.5" />
                      Cobrar
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
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
