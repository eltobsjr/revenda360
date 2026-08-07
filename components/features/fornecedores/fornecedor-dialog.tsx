"use client";

import { useActionState, useState } from "react";
import { criarFornecedor, atualizarFornecedor } from "@/app/(app)/fornecedores/actions";
import { FORNECEDOR_INITIAL_STATE } from "@/app/(app)/fornecedores/fornecedor-state";
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

type FornecedorExistente = {
  id: string;
  nome: string;
  contato: string | null;
  cnpjCpf: string | null;
  observacoes: string | null;
};

export function FornecedorDialog({
  fornecedor,
  triggerLabel,
}: {
  fornecedor?: FornecedorExistente;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    fornecedor ? atualizarFornecedor : criarFornecedor,
    FORNECEDOR_INITIAL_STATE,
  );
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={fornecedor ? "outline" : "default"} size={fornecedor ? "sm" : "default"} />}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar fornecedor" : "Cadastrar fornecedor"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {fornecedor ? <input type="hidden" name="fornecedorId" value={fornecedor.id} /> : null}
          <FormField label="Nome" htmlFor="nome">
            <Input id="nome" name="nome" defaultValue={fornecedor?.nome} required />
          </FormField>
          <FormField label="Contato" htmlFor="contato">
            <Input id="contato" name="contato" defaultValue={fornecedor?.contato ?? ""} />
          </FormField>
          <FormField label="CNPJ/CPF" htmlFor="cnpjCpf">
            <Input id="cnpjCpf" name="cnpjCpf" defaultValue={fornecedor?.cnpjCpf ?? ""} />
          </FormField>
          <FormField label="Observações" htmlFor="observacoes">
            <Input id="observacoes" name="observacoes" defaultValue={fornecedor?.observacoes ?? ""} />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Salvando…" : fornecedor ? "Salvar alterações" : "Cadastrar fornecedor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
