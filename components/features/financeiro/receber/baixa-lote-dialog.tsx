"use client";

import { useActionState, useState } from "react";
import { darBaixaParcelasEmLote } from "@/app/(app)/financeiro/receber/actions";
import { BAIXA_LOTE_INITIAL_STATE } from "@/app/(app)/financeiro/receber/baixa-parcela-state";
import { calcularJurosMulta, totalComJurosMulta } from "@/lib/domain/juros";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ParcelaRow } from "@/lib/data/contas-receber";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Baixa de várias parcelas de uma vez, com uma única forma de pagamento.
 *
 * Não há campo de desconto aqui de propósito: desconto é decisão parcela a
 * parcela (e fica gravado em `desconto_aplicado` para auditoria). Quem precisa
 * dar desconto usa o botão "Dar baixa" da linha, que continua existindo.
 */
export function BaixaLoteDialog({
  parcelas,
  multaPct,
  moraPctDia,
  onBaixaConcluida,
}: {
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
  /** Chamado quando ao menos uma parcela foi baixada, para limpar a seleção. */
  onBaixaConcluida: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    darBaixaParcelasEmLote,
    BAIXA_LOTE_INITIAL_STATE,
  );
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    // Em sucesso parcial o modal fica aberto mostrando o que falhou: a lista
    // acima já encolhe sozinha (o que foi baixado deixa de ser baixável e sai
    // da seleção na revalidação), então o que sobra na tela é exatamente o que
    // o usuário pode tentar de novo.
    if (state.resumo && state.resumo.baixadas > 0 && state.resumo.falhas.length === 0) {
      onBaixaConcluida();
      setOpen(false);
    }
  }

  const linhas = parcelas.map((p) => ({
    parcela: p,
    total: p.valor + calcularJurosMulta(p.valor, p.diasAtraso, multaPct, moraPctDia),
  }));
  const totalGeral = totalComJurosMulta(parcelas, multaPct, moraPctDia);
  const totalJuros = linhas.reduce((soma, l) => soma + (l.total - l.parcela.valor), 0);
  const rotuloParcela = (p: ParcelaRow) =>
    `${p.cliente} — parcela ${p.numero}/${p.totalParcelas}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Dar baixa em lote</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Baixa em lote</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {parcelas.length} {parcelas.length === 1 ? "parcela selecionada" : "parcelas selecionadas"}
          , com juros e multa já calculados.
        </p>

        <ul className="flex max-h-56 flex-col overflow-y-auto text-sm">
          {linhas.map(({ parcela, total }) => (
            <li key={parcela.id} className="flex items-center justify-between gap-3 border-t py-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{rotuloParcela(parcela)}</span>
                <span className="text-xs text-muted-foreground">
                  Venc. {formatDataBR(parcela.vencimento)}
                  {parcela.diasAtraso > 0 ? ` · ${parcela.diasAtraso} dias de atraso` : null}
                </span>
              </div>
              <span className="shrink-0 tabular-nums">{formatBRL(total)}</span>
            </li>
          ))}
        </ul>

        <form action={formAction} className="flex flex-col gap-4">
          {parcelas.map((p) => (
            <input key={p.id} type="hidden" name="parcelaIds" value={p.id} />
          ))}

          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between border-t py-1.5">
              <dt className="text-muted-foreground">Juros + multa no lote</dt>
              <dd className="text-destructive">{formatBRL(totalJuros)}</dd>
            </div>
          </dl>

          <FormField label="Forma de pagamento" htmlFor="formaPagamentoLote">
            <NativeSelect
              id="formaPagamentoLote"
              name="formaPagamento"
              defaultValue="pix"
              className="w-full"
            >
              <NativeSelectOption value="pix">PIX</NativeSelectOption>
              <NativeSelectOption value="dinheiro">Dinheiro</NativeSelectOption>
              <NativeSelectOption value="cartao">Cartão</NativeSelectOption>
              <NativeSelectOption value="transferencia">Transferência</NativeSelectOption>
            </NativeSelect>
          </FormField>

          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total a receber</span>
            <span className="text-success">{formatBRL(totalGeral)}</span>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.resumo && state.resumo.falhas.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-lg border border-destructive/40 p-3 text-sm">
              <p className="font-medium">{state.resumo.mensagem}</p>
              <ul className="flex flex-col gap-0.5 text-xs text-destructive">
                {state.resumo.falhas.map((falha) => {
                  const parcela = parcelas.find((p) => p.id === falha.parcelaId);
                  return (
                    <li key={falha.parcelaId}>
                      {parcela ? rotuloParcela(parcela) : "Parcela"}: {falha.erro}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <Button type="submit" disabled={pending || parcelas.length === 0} className="w-full">
            {pending
              ? "Confirmando…"
              : `Confirmar ${parcelas.length} ${parcelas.length === 1 ? "recebimento" : "recebimentos"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
