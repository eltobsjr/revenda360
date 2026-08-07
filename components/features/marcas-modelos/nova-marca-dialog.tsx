"use client";

import { useActionState, useState } from "react";
import { criarMarca } from "@/app/(app)/marcas-modelos/actions";
import { MARCA_MODELO_INITIAL_STATE } from "@/app/(app)/marcas-modelos/marca-modelo-state";
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

export function NovaMarcaDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarMarca, MARCA_MODELO_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nova marca</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar marca</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="novaMarcaNome">
            <Input id="novaMarcaNome" name="nome" required />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar marca"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
