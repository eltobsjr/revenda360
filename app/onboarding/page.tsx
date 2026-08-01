"use client";

import { useActionState } from "react";
import { criarTenant } from "./actions";
import { ONBOARDING_INITIAL_STATE } from "./onboarding-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { Separator } from "@/components/ui/separator";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    criarTenant,
    ONBOARDING_INITIAL_STATE,
  );

  return (
    <AuthSplitLayout
      eyebrow="Dá para editar tudo depois"
      title="Vamos configurar sua revenda."
      description="Só o essencial agora — nome da loja e quem vai gerenciar."
    >
      <h1 className="font-heading mb-6 text-2xl font-semibold">
        Configurar revenda
      </h1>
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Nome da revenda" htmlFor="nomeRevenda">
          <Input id="nomeRevenda" name="nomeRevenda" required placeholder="Ex.: Veículos Silva" />
        </FormField>
        <FormField label="Seu nome" htmlFor="nomeUsuario">
          <Input id="nomeUsuario" name="nomeUsuario" required placeholder="Seu nome completo" />
        </FormField>
        <Separator />
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Primeira loja
          </p>
          <div className="flex flex-col gap-4">
            <FormField label="Nome da loja" htmlFor="lojaNome">
              <Input id="lojaNome" name="lojaNome" required placeholder="Ex.: Matriz" />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FormField label="Cidade" htmlFor="lojaCidade">
                  <Input id="lojaCidade" name="lojaCidade" />
                </FormField>
              </div>
              <FormField label="UF" htmlFor="lojaUf">
                <NativeSelect id="lojaUf" name="lojaUf" defaultValue="">
                  <NativeSelectOption value="" />
                  {UFS.map((uf) => (
                    <NativeSelectOption key={uf} value={uf}>
                      {uf}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
          </div>
        </div>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Configurando…" : "Começar a usar o Revenda 360"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
