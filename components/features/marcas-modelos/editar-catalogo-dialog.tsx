"use client";

import { useActionState, useState } from "react";
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
import type { MarcaModeloState } from "@/app/(app)/marcas-modelos/actions";

const INITIAL_STATE: MarcaModeloState = { error: null, sucesso: false };

/** Editar nome/ativo de uma marca ou modelo (Fase 17) — genérico pros dois níveis do catálogo. */
export function EditarCatalogoDialog({
  titulo,
  idFieldName,
  id,
  nome,
  ativo,
  action,
}: {
  titulo: string;
  idFieldName: string;
  id: string;
  nome: string;
  ativo: boolean;
  action: (prevState: MarcaModeloState, formData: FormData) => Promise<MarcaModeloState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>Editar</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name={idFieldName} value={id} />
          <FormField label="Nome" htmlFor={`nome-${id}`}>
            <Input id={`nome-${id}`} name="nome" defaultValue={nome} required />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" value="true" defaultChecked={ativo} className="size-4" />
            Ativo
          </label>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
