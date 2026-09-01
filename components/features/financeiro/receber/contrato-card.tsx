"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBRL, formatDataBR } from "@/lib/format";
import { calcularJurosMulta, totalComJurosMulta } from "@/lib/domain/juros";
import { ParcelaStatusBadge } from "./parcela-status-badge";
import { BaixaParcelaDialog } from "./baixa-parcela-dialog";
import { BaixaLoteDialog } from "./baixa-lote-dialog";
import { RenegociarDialog } from "./renegociar-dialog";
import { useSelecaoParcelas } from "./use-selecao-parcelas";
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
  const selecao = useSelecaoParcelas(parcelasPendentes);
  const proxima = parcelasPendentes[0] ?? null;
  const jurosProxima = proxima ? calcularJurosMulta(proxima.valor, proxima.diasAtraso, multaPct, moraPctDia) : 0;
  const valorProximaComJuros = proxima ? proxima.valor + jurosProxima : 0;
  const totalSelecionado = totalComJurosMulta(selecao.selecionadas, multaPct, moraPctDia);

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
              <>
                {selecao.baixaveis.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      aria-label="Selecionar todas as parcelas do contrato"
                      checked={selecao.todasSelecionadas}
                      indeterminate={selecao.parcialmenteSelecionadas}
                      onCheckedChange={selecao.alternarTodas}
                    />
                    <span>Selecionar todas para baixar de uma vez</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 overflow-y-auto">
                  {parcelasPendentes.map((p) => {
                    const juros = calcularJurosMulta(p.valor, p.diasAtraso, multaPct, moraPctDia);
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 border-t pt-3">
                        <div className="flex items-center gap-3">
                          {p.podeBaixar ? (
                            <Checkbox
                              aria-label={`Selecionar parcela ${p.numero}/${p.totalParcelas}`}
                              checked={selecao.estaSelecionada(p.id)}
                              onCheckedChange={(marcada) => selecao.alternarParcela(p.id, marcada)}
                            />
                          ) : null}
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">
                              Parcela {p.numero}/{p.totalParcelas} — {formatDataBR(p.vencimento)}
                            </span>
                            <ParcelaStatusBadge status={p.status} />
                          </div>
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

                {selecao.selecionadas.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {selecao.selecionadas.length}{" "}
                        {selecao.selecionadas.length === 1
                          ? "parcela selecionada"
                          : "parcelas selecionadas"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Total com juros e multa:{" "}
                        <strong className="font-semibold text-foreground tabular-nums">
                          {formatBRL(totalSelecionado)}
                        </strong>
                      </span>
                    </div>
                    <BaixaLoteDialog
                      parcelas={selecao.selecionadas}
                      multaPct={multaPct}
                      moraPctDia={moraPctDia}
                      onBaixaConcluida={selecao.limpar}
                    />
                  </div>
                ) : null}
              </>
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
