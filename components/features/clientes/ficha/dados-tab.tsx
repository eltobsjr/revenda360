"use client";

import { useActionState } from "react";
import { atualizarCliente } from "@/app/(app)/clientes/actions";
import { CLIENTE_INITIAL_STATE } from "@/app/(app)/clientes/cliente-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import type { ClienteListado } from "@/lib/data/clientes";

export function DadosTab({
  cliente,
  mostrarCpf,
}: {
  cliente: ClienteListado;
  mostrarCpf: boolean;
}) {
  const [state, formAction, pending] = useActionState(atualizarCliente, CLIENTE_INITIAL_STATE);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="clienteId" value={cliente.id} />
      <FormField label="Nome" htmlFor="nome">
        <Input id="nome" name="nome" defaultValue={cliente.nome} required />
      </FormField>
      {mostrarCpf ? (
        <FormField label="CPF" htmlFor="cpf">
          <Input id="cpf" name="cpf" defaultValue={cliente.cpf ?? ""} />
        </FormField>
      ) : null}
      <FormField label="WhatsApp" htmlFor="whatsapp">
        <Input id="whatsapp" name="whatsapp" defaultValue={cliente.whatsapp ?? ""} />
      </FormField>
      <FormField label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={cliente.email ?? ""} />
      </FormField>
      <FormField label="Cidade" htmlFor="cidade">
        <Input id="cidade" name="cidade" defaultValue={cliente.cidade ?? ""} />
      </FormField>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.sucesso ? <p className="text-sm text-success">Dados salvos.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
