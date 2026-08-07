"use client";

import { useActionState } from "react";
import { criarRevenda } from "@/app/admin/revendas/nova/actions";
import { REVENDA_INITIAL_STATE } from "@/app/admin/revendas/nova/revenda-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkField } from "@/components/copy-link-field";

export function RevendaForm() {
  const [state, formAction, pending] = useActionState(criarRevenda, REVENDA_INITIAL_STATE);

  if (state.linkDefinirSenha) {
    return (
      <Card className="border-success/40 bg-success/10">
        <CardContent className="text-sm">
          <p className="font-semibold">Revenda criada com sucesso.</p>
          <p className="mt-1">
            Envie este link para <strong>{state.emailCriado}</strong> — é assim
            que a pessoa escolhe a própria senha:
          </p>
          <CopyLinkField link={state.linkDefinirSenha} label="Link para definir senha" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome da revenda" htmlFor="nomeRevenda">
              <Input id="nomeRevenda" name="nomeRevenda" required />
            </FormField>
            <FormField label="Nome do gestor" htmlFor="nomeGestor">
              <Input id="nomeGestor" name="nomeGestor" required />
            </FormField>
            <FormField label="E-mail do gestor" htmlFor="emailGestor">
              <Input id="emailGestor" name="emailGestor" type="email" required />
            </FormField>
            <FormField label="Nome da loja" htmlFor="nomeLoja">
              <Input id="nomeLoja" name="nomeLoja" required />
            </FormField>
            <FormField label="Cidade da loja" htmlFor="cidadeLoja">
              <Input id="cidadeLoja" name="cidadeLoja" />
            </FormField>
            <FormField label="UF da loja" htmlFor="ufLoja">
              <Input id="ufLoja" name="ufLoja" maxLength={2} className="uppercase" />
            </FormField>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Criando…" : "Criar revenda"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
