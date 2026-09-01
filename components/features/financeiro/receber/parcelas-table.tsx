"use client";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBRL, formatDataBR } from "@/lib/format";
import { totalComJurosMulta } from "@/lib/domain/juros";
import type { ParcelaRow } from "@/lib/data/contas-receber";
import { ParcelaStatusBadge } from "./parcela-status-badge";
import { BaixaParcelaDialog } from "./baixa-parcela-dialog";
import { BaixaLoteDialog } from "./baixa-lote-dialog";
import { useSelecaoParcelas } from "./use-selecao-parcelas";

export function ParcelasTable({
  parcelas,
  multaPct,
  moraPctDia,
}: {
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
}) {
  const selecao = useSelecaoParcelas(parcelas);

  const totalValor = parcelas.reduce((soma, p) => soma + p.valor, 0);
  const totalPago = parcelas.reduce((soma, p) => soma + p.valorPago, 0);
  const totalSelecionado = totalComJurosMulta(selecao.selecionadas, multaPct, moraPctDia);

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {selecao.baixaveis.length > 0 ? (
                    <Checkbox
                      aria-label="Selecionar todas as parcelas"
                      checked={selecao.todasSelecionadas}
                      indeterminate={selecao.parcialmenteSelecionadas}
                      onCheckedChange={selecao.alternarTodas}
                    />
                  ) : null}
                </TableHead>
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
                  <TableCell>
                    {p.podeBaixar ? (
                      <Checkbox
                        aria-label={`Selecionar parcela ${p.numero}/${p.totalParcelas} de ${p.cliente}`}
                        checked={selecao.estaSelecionada(p.id)}
                        onCheckedChange={(marcada) => selecao.alternarParcela(p.id, marcada)}
                      />
                    ) : null}
                  </TableCell>
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
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Nenhuma parcela encontrada.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
            {parcelas.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5}>Totais</TableCell>
                  <TableCell>{formatBRL(totalValor)}</TableCell>
                  <TableCell>{formatBRL(totalPago)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </CardContent>
      </Card>

      {selecao.selecionadas.length > 0 ? (
        <BarraSelecao
          parcelas={selecao.selecionadas}
          total={totalSelecionado}
          multaPct={multaPct}
          moraPctDia={moraPctDia}
          onLimpar={selecao.limpar}
        />
      ) : null}
    </div>
  );
}

/**
 * Barra de ação fixa no rodapé enquanto há parcelas marcadas. Fixa (e não no
 * topo da tabela) porque a seleção costuma ser feita rolando uma lista longa —
 * o botão precisa continuar ao alcance sem ter que voltar ao topo.
 */
function BarraSelecao({
  parcelas,
  total,
  multaPct,
  moraPctDia,
  onLimpar,
}: {
  parcelas: ParcelaRow[];
  total: number;
  multaPct: number;
  moraPctDia: number;
  onLimpar: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {parcelas.length} {parcelas.length === 1 ? "parcela selecionada" : "parcelas selecionadas"}
        </span>
        <span className="text-xs text-muted-foreground">
          Total com juros e multa:{" "}
          <strong className="font-semibold text-foreground tabular-nums">{formatBRL(total)}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onLimpar}>
          Limpar seleção
        </Button>
        <BaixaLoteDialog
          parcelas={parcelas}
          multaPct={multaPct}
          moraPctDia={moraPctDia}
          onBaixaConcluida={onLimpar}
        />
      </div>
    </div>
  );
}
