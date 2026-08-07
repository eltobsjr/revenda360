"use client";

import { useActionState } from "react";
import { definirSenha } from "./actions";
import { DEFINIR_SENHA_INITIAL_STATE } from "./definir-senha-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default function DefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(
    definirSenha,
    DEFINIR_SENHA_INITIAL_STATE,
  );

  return (
    <AuthSplitLayout
      eyebrow="Sua conta, sua senha"
      title="Escolha a senha da sua conta."
      description="Defina uma senha só sua pra acessar o Revenda 360 daqui pra frente."
    >
      <h1 className="font-heading mb-6 text-2xl font-semibold">Definir senha</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Nova senha" htmlFor="senha">
          <Input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
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
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Salvando…" : "Salvar senha e entrar"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
