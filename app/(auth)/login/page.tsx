"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../actions";
import { AUTH_INITIAL_STATE } from "../auth-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { AuthSplitLayout } from "@/components/auth-split-layout";

function LinkInvalidoNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("erro") !== "link-invalido") return null;
  return (
    <p className="text-sm text-destructive">
      Este link de definir senha é inválido ou expirou. Peça um novo pra quem
      administra sua revenda.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, AUTH_INITIAL_STATE);

  return (
    <AuthSplitLayout
      eyebrow="Feito para quem vem do Excel"
      title="A gestão da sua revenda em um só lugar."
      description="Estoque, vendas, crediário e caixa — sem planilha, sem perder o controle."
    >
      <h1 className="font-heading mb-6 text-2xl font-semibold">Entrar</h1>
      <Suspense>
        <LinkInvalidoNotice />
      </Suspense>
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Senha" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </FormField>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Entrando…" : "Entrar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Acesso liberado pela equipe do Revenda 360. Esqueceu a senha? Fale com
          quem administra sua revenda.
        </p>
      </form>
    </AuthSplitLayout>
  );
}
