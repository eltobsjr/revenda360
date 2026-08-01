"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import { AUTH_INITIAL_STATE } from "../auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signup, AUTH_INITIAL_STATE);

  return (
    <AuthSplitLayout
      eyebrow="Leva menos de um minuto para configurar"
      title="Substitua a planilha sem assustar quem veio dela."
      description="Cadastre veículo, feche venda e receba parcela mais rápido que no Excel."
    >
      {state.message ? (
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm">{state.message}</p>
          <Link href="/login" className="text-sm font-medium text-primary">
            Voltar para o login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-heading mb-6 text-2xl font-semibold">Criar revenda</h1>
          <form action={formAction} className="flex flex-col gap-4">
            <FormField label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </FormField>
            <FormField label="Senha" htmlFor="password">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </FormField>
            <FormField label="Confirme a senha" htmlFor="confirmacao">
              <Input
                id="confirmacao"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </FormField>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Criando conta…" : "Criar conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-primary">
                Entrar
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthSplitLayout>
  );
}
