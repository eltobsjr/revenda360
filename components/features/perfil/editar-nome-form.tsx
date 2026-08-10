"use client";

import { useActionState } from "react";
import { atualizarNome } from "@/app/(app)/perfil/actions";
import { ATUALIZAR_NOME_INITIAL_STATE } from "@/app/(app)/perfil/perfil-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";

export function EditarNomeForm({ nomeAtual }: { nomeAtual: string }) {
  const [state, formAction, pending] = useActionState(atualizarNome, ATUALIZAR_NOME_INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <FormField label="Nome" htmlFor="nome" error={state.error}>
        <Input id="nome" name="nome" defaultValue={nomeAtual} required />
      </FormField>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar nome"}
        </Button>
        {state.sucesso ? <span className="text-sm text-success">Nome atualizado.</span> : null}
      </div>
    </form>
  );
}
