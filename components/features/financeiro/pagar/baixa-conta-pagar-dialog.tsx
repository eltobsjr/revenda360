"use client";

import { useActionState, useState } from "react";
import { darBaixaContaPagar } from "@/app/(app)/financeiro/pagar/actions";
import { CONTA_PAGAR_INITIAL_STATE } from "@/app/(app)/financeiro/pagar/conta-pagar-state";
import { formatBRL, formatDataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ContaPagarRow } from "@/lib/data/contas-pagar";

export function BaixaContaPagarDialog({ conta }: { conta: ContaPagarRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    darBaixaContaPagar,
    CONTA_PAGAR_INITIAL_STATE,
  );
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="secondary" />}>Dar baixa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar conta</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {conta.descricao} · vencimento {formatDataBR(conta.vencimento)}
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="contaPagarId" value={conta.id} />
          <div className="flex justify-between border-t py-1.5 text-sm">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-semibold">{formatBRL(conta.valor)}</span>
          </div>
          <FormField label="Forma de pagamento" htmlFor="formaPagamento">
            <NativeSelect id="formaPagamento" name="formaPagamento" defaultValue="pix">
              <NativeSelectOption value="pix">PIX</NativeSelectOption>
              <NativeSelectOption value="dinheiro">Dinheiro</NativeSelectOption>
              <NativeSelectOption value="cartao">Cartão</NativeSelectOption>
              <NativeSelectOption value="transferencia">Transferência</NativeSelectOption>
            </NativeSelect>
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Confirmando…" : "Confirmar pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
