"use client";

import { useActionState, useState } from "react";
import { criarLead } from "@/app/(app)/vendas/leads/actions";
import { LEAD_INITIAL_STATE } from "@/app/(app)/vendas/leads/lead-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NovoLeadDialog({ veiculos }: { veiculos: { id: string; nome: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(criarLead, LEAD_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Novo lead</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar lead</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" required />
          </FormField>
          <FormField label="Contato (WhatsApp)" htmlFor="contato">
            <Input id="contato" name="contato" />
          </FormField>
          <FormField label="Origem" htmlFor="origem">
            <Input id="origem" name="origem" placeholder="Instagram, Indicação, OLX…" />
          </FormField>
          <FormField label="Veículo de interesse" htmlFor="veiculoInteresseId">
            <NativeSelect id="veiculoInteresseId" name="veiculoInteresseId" defaultValue="">
              <NativeSelectOption value="">— nenhum —</NativeSelectOption>
              {veiculos.map((v) => (
                <NativeSelectOption key={v.id} value={v.id}>
                  {v.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
