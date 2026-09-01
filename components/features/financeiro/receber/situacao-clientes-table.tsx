import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { linkCobrancaWhatsapp } from "@/lib/domain/whatsapp";
import { SituacaoClienteBadge } from "./situacao-cliente-badge";
import type { SituacaoClienteRow } from "@/lib/data/contas-receber";

export function SituacaoClientesTable({ linhas }: { linhas: SituacaoClienteRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor pendente</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((r) => (
              <TableRow key={r.clienteChave}>
                <TableCell className="font-medium">{r.cliente}</TableCell>
                <TableCell>
                  <SituacaoClienteBadge situacao={r.situacao} />
                </TableCell>
                <TableCell className="font-semibold">{formatBRL(r.valorPendente)}</TableCell>
                <TableCell>
                  {r.whatsapp && r.qtdParcelasAtrasadas > 0 ? (
                    <a
                      href={linkCobrancaWhatsapp(
                        r.whatsapp,
                        `Olá, ${r.cliente}! Identificamos um valor em atraso de ${formatBRL(r.valorEmAtraso)} referente ao seu contrato conosco. Podemos combinar o pagamento?`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      <MessageCircle className="size-3.5" />
                      Cobrar
                    </a>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum cliente com contrato de crediário ativo.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
