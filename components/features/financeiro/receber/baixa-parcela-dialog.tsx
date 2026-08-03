"use client";

import { useActionState, useState } from "react";
import { darBaixaParcela } from "@/app/(app)/financeiro/receber/actions";
import { BAIXA_PARCELA_INITIAL_STATE } from "@/app/(app)/financeiro/receber/baixa-parcela-state";
import { calcularDiasAtraso, calcularJurosMulta } from "@/lib/domain/juros";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BaixaParcelaDialog({
  parcela,
  multaPct,
  moraPctDia,
}: {
  parcela: {
    id: string;
    cliente: string;
    veiculo: string;
    numero: number;
    totalParcelas: number;
    vencimento: string;
    valor: number;
  };
  multaPct: number;
  moraPctDia: number;
}) {
  const [open, setOpen] = useState(false);
  const [desconto, setDesconto] = useState("0");
  const [state, formAction, pending] = useActionState(darBaixaParcela, BAIXA_PARCELA_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  const diasAtraso = calcularDiasAtraso(parcela.vencimento, new Date());
  const juros = calcularJurosMulta(parcela.valor, diasAtraso, multaPct, moraPctDia);
  const descontoNum = Number(desconto.replace(",", ".")) || 0;
  const valorFinal = Math.max(0, parcela.valor + juros - descontoNum);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary" />}>Dar baixa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixa de parcela</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {parcela.cliente} — {parcela.veiculo} · parcela {parcela.numero}/{parcela.totalParcelas}
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="parcelaId" value={parcela.id} />
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between border-t py-1.5">
              <dt className="text-muted-foreground">Valor original</dt>
              <dd>{formatBRL(parcela.valor)}</dd>
            </div>
            <div className="flex justify-between border-t py-1.5">
              <dt className="text-muted-foreground">Dias de atraso</dt>
              <dd>{diasAtraso}</dd>
            </div>
            <div className="flex justify-between border-t py-1.5">
              <dt className="text-muted-foreground">Juros + multa</dt>
              <dd className="text-destructive">{formatBRL(juros)}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Desconto (R$)" htmlFor="desconto">
              <Input
                id="desconto"
                name="desconto"
                inputMode="decimal"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </FormField>
            <FormField label="Forma de pagamento" htmlFor="formaPagamento">
              <NativeSelect id="formaPagamento" name="formaPagamento" defaultValue="pix">
                <NativeSelectOption value="pix">PIX</NativeSelectOption>
                <NativeSelectOption value="dinheiro">Dinheiro</NativeSelectOption>
                <NativeSelectOption value="cartao">Cartão</NativeSelectOption>
                <NativeSelectOption value="transferencia">Transferência</NativeSelectOption>
              </NativeSelect>
            </FormField>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Valor a receber</span>
            <span className="text-success">{formatBRL(valorFinal)}</span>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Confirmando…" : "Confirmar recebimento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
