"use client";

import { useActionState, useState } from "react";
import { criarContaPagar } from "@/app/(app)/financeiro/pagar/actions";
import { CONTA_PAGAR_INITIAL_STATE } from "@/app/(app)/financeiro/pagar/conta-pagar-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ContaPagarForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarContaPagar, CONTA_PAGAR_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nova conta</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar conta a pagar</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Descrição" htmlFor="descricao">
            <Input id="descricao" name="descricao" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Categoria" htmlFor="categoria">
              <Input id="categoria" name="categoria" placeholder="Aluguel, Salários…" />
            </FormField>
            <FormField label="Fornecedor" htmlFor="fornecedor">
              <Input id="fornecedor" name="fornecedor" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor (R$)" htmlFor="valor">
              <Input id="valor" name="valor" inputMode="decimal" required />
            </FormField>
            <FormField label="Vencimento" htmlFor="vencimento">
              <Input id="vencimento" name="vencimento" type="date" required />
            </FormField>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar conta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
