"use client";

import { useActionState } from "react";
import { trocarSenha } from "@/app/(app)/perfil/actions";
import { TROCAR_SENHA_INITIAL_STATE } from "@/app/(app)/perfil/perfil-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";

export function TrocarSenhaCard() {
  const [state, formAction, pending] = useActionState(trocarSenha, TROCAR_SENHA_INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Nova senha" htmlFor="senha">
          <Input id="senha" name="senha" type="password" autoComplete="new-password" required minLength={8} />
        </FormField>
        <FormField label="Confirmar senha" htmlFor="confirmacao">
          <Input
            id="confirmacao"
            name="confirmacao"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </FormField>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Trocando…" : "Trocar senha"}
        </Button>
        {state.sucesso ? <span className="text-sm text-success">Senha atualizada.</span> : null}
      </div>
    </form>
  );
}
