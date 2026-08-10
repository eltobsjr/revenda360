"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatBRL, formatDataBR } from "@/lib/format";
import { calcularJurosMulta } from "@/lib/domain/juros";
import { ParcelaStatusBadge } from "./parcela-status-badge";
import { BaixaParcelaDialog } from "./baixa-parcela-dialog";
import { RenegociarDialog } from "./renegociar-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ContratoRow, ParcelaRow } from "@/lib/data/contas-receber";

export function ContratoCard({
  contrato,
  parcelasPendentes,
  multaPct,
  moraPctDia,
}: {
  contrato: ContratoRow;
  parcelasPendentes: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
}) {
  const proxima = parcelasPendentes[0] ?? null;
  const jurosProxima = proxima ? calcularJurosMulta(proxima.valor, proxima.diasAtraso, multaPct, moraPctDia) : 0;
  const valorProximaComJuros = proxima ? proxima.valor + jurosProxima : 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Dialog>
          <DialogTrigger
            render={<button type="button" className="flex w-full flex-col gap-3 text-left" />}
          >
            <div>
              <div className="text-sm font-semibold">{contrato.cliente}</div>
              <div className="text-xs text-muted-foreground">{contrato.veiculo}</div>
            </div>
            {proxima ? (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  Próximo vencimento:{" "}
                  <strong className="font-medium text-foreground">
                    {formatDataBR(proxima.vencimento)}
                  </strong>
                </span>
                <ParcelaStatusBadge status={proxima.status} />
              </div>
            ) : null}
            {proxima ? (
              <div className="text-base font-bold tabular-nums">{formatBRL(valorProximaComJuros)}</div>
            ) : contrato.saldo <= 0 ? (
              <div className="text-sm text-success">Contrato quitado</div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhuma parcela pendente</div>
            )}
          </DialogTrigger>
          <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {contrato.cliente} — {contrato.veiculo}
              </DialogTitle>
            </DialogHeader>
            {parcelasPendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma parcela pendente.</p>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto">
                {parcelasPendentes.map((p) => {
                  const juros = calcularJurosMulta(p.valor, p.diasAtraso, multaPct, moraPctDia);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 border-t pt-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          Parcela {p.numero}/{p.totalParcelas} — {formatDataBR(p.vencimento)}
                        </span>
                        <ParcelaStatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatBRL(p.valor + juros)}
                        </span>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-success" style={{ width: `${contrato.pctPago}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBRL(contrato.totalPago)} pago</span>
          <span>{formatBRL(contrato.saldo)} saldo</span>
        </div>
        {contrato.saldo > 0 ? <RenegociarDialog contrato={contrato} /> : null}
      </CardContent>
    </Card>
  );
}
