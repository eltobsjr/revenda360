"use client";

import { useState } from "react";
import { formatBRL, formatDataBR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { VendaRow } from "@/lib/data/vendas";

const TIPO_PAGAMENTO_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao: "Cartão",
  transferencia: "Transferência",
  troca: "Troca",
  financiamento_bancario: "Financiamento bancário",
  crediario: "Crediário próprio",
};

export function VendasTabela({
  vendas,
  mostrarComissao,
}: {
  vendas: VendaRow[];
  mostrarComissao: boolean;
}) {
  const [selecionada, setSelecionada] = useState<VendaRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor final</TableHead>
            {mostrarComissao ? <TableHead className="text-right">Comissão</TableHead> : null}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas.map((v) => (
            <TableRow
              key={v.id}
              className="cursor-pointer"
              onClick={() => setSelecionada(v)}
            >
              <TableCell className="font-medium">
                {v.veiculo}
                <span className="block text-xs text-muted-foreground">{v.placa}</span>
              </TableCell>
              <TableCell>{v.cliente}</TableCell>
              <TableCell className="text-muted-foreground">{v.vendedor}</TableCell>
              <TableCell className="text-muted-foreground">{formatDataBR(v.dataVenda)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatBRL(v.valorFinal)}</TableCell>
              {mostrarComissao ? (
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {v.comissaoValor != null ? formatBRL(v.comissaoValor) : "—"}
                </TableCell>
              ) : null}
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    v.status === "confirmada"
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }
                >
                  {v.status === "confirmada" ? "Confirmada" : "Cancelada"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selecionada} onOpenChange={(open) => !open && setSelecionada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selecionada?.veiculo}</DialogTitle>
          </DialogHeader>
          {selecionada ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                {selecionada.cliente} · {formatDataBR(selecionada.dataVenda)}
              </p>
              <dl className="flex flex-col gap-1">
                {selecionada.pagamentos.map((p, i) => (
                  <div key={i} className="flex justify-between border-t py-1.5">
                    <dt className="text-muted-foreground">
                      {TIPO_PAGAMENTO_LABEL[p.tipo] ?? p.tipo}
                    </dt>
                    <dd className="tabular-nums">{formatBRL(p.valor)}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatBRL(selecionada.valorFinal)}</span>
              </div>
              {mostrarComissao && selecionada.comissaoValor != null ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Comissão ({selecionada.comissaoPct}%)</span>
                  <span>{formatBRL(selecionada.comissaoValor)}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
