"use client";

import { useActionState, useState } from "react";
import { criarModelo } from "@/app/(app)/marcas-modelos/actions";
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

export function NovoModeloDialog({ marcaId, marcaNome }: { marcaId: string; marcaNome: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarModelo, MARCA_MODELO_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Novo modelo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar modelo em {marcaNome}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="marcaId" value={marcaId} />
          <FormField label="Nome" htmlFor={`novoModeloNome-${marcaId}`}>
            <Input id={`novoModeloNome-${marcaId}`} name="nome" required />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar modelo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
