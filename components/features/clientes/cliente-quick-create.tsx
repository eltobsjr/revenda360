"use client";

import { useActionState, useState } from "react";
import { criarCliente } from "@/app/(app)/clientes/actions";
import { CLIENTE_INITIAL_STATE } from "@/app/(app)/clientes/cliente-state";
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

export function ClienteQuickCreate() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarCliente, CLIENTE_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Novo cliente</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar cliente</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required />
          </FormField>
          <FormField label="CPF" htmlFor="cpf">
            <Input id="cpf" name="cpf" />
          </FormField>
          <FormField label="WhatsApp" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" />
          </FormField>
          <FormField label="Cidade" htmlFor="cidade">
            <Input id="cidade" name="cidade" />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
