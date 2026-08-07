"use client";

import { useActionState, useState } from "react";
import { criarProposta } from "@/app/(app)/vendas/propostas/actions";
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

const INITIAL_STATE = { error: null as string | null, sucesso: false };

export function NovaPropostaDialog({
  veiculos,
  clientes,
}: {
  veiculos: { id: string; nome: string }[];
  clientes: { id: string; nome: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [state, formAction, pending] = useActionState(criarProposta, INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nova proposta</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar proposta</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Veículo" htmlFor="veiculoId">
            <NativeSelect id="veiculoId" name="veiculoId" defaultValue="" required>
              <NativeSelectOption value="">— escolha —</NativeSelectOption>
              {veiculos.map((v) => (
                <NativeSelectOption key={v.id} value={v.id}>
                  {v.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Cliente cadastrado" htmlFor="clienteId">
            <NativeSelect
              id="clienteId"
              name="clienteId"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <NativeSelectOption value="">— nenhum, informar nome abaixo —</NativeSelectOption>
              {clientes.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          {!clienteId ? (
            <FormField label="Nome do cliente (sem cadastro)" htmlFor="clienteNomeAvulso">
              <Input id="clienteNomeAvulso" name="clienteNomeAvulso" />
            </FormField>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor proposto (R$)" htmlFor="valorProposto">
              <Input id="valorProposto" name="valorProposto" inputMode="decimal" required />
            </FormField>
            <FormField label="Validade" htmlFor="validade">
              <Input id="validade" name="validade" type="date" />
            </FormField>
          </div>
          <FormField label="Condições" htmlFor="condicoes">
            <Input id="condicoes" name="condicoes" placeholder="Entrada + financiamento, à vista..." />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : "Cadastrar proposta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
