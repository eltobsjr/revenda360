"use client";

import { useActionState } from "react";
import { criarMembroEquipe } from "@/app/(app)/equipe/actions";
import { EQUIPE_INITIAL_STATE } from "@/app/(app)/equipe/equipe-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { Card, CardContent } from "@/components/ui/card";

export function EquipeForm({ lojas }: { lojas: { id: string; nome: string }[] }) {
  const [state, formAction, pending] = useActionState(
    criarMembroEquipe,
    EQUIPE_INITIAL_STATE,
  );

  if (state.senhaTemporaria) {
    return (
      <Card className="border-success/40 bg-success/10">
        <CardContent className="text-sm">
          <p className="font-semibold">Usuário criado com sucesso.</p>
          <p className="mt-1">
            Envie estas credenciais para <strong>{state.emailCriado}</strong> —
            peça para trocar a senha no primeiro acesso:
          </p>
          <p className="mt-2 rounded-md bg-background px-3 py-2 font-mono text-sm">
            {state.senhaTemporaria}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required />
            </FormField>
            <FormField label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" required />
            </FormField>
            <FormField label="Papel" htmlFor="role">
              <NativeSelect id="role" name="role" defaultValue="vendedor">
                <NativeSelectOption value="vendedor">Vendedor</NativeSelectOption>
                <NativeSelectOption value="financeiro">Financeiro</NativeSelectOption>
                <NativeSelectOption value="gestor">Gestor</NativeSelectOption>
              </NativeSelect>
            </FormField>
            <FormField label="Loja" htmlFor="lojaId">
              <NativeSelect id="lojaId" name="lojaId" defaultValue="">
                <NativeSelectOption value="">—</NativeSelectOption>
                {lojas.map((loja) => (
                  <NativeSelectOption key={loja.id} value={loja.id}>
                    {loja.nome}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Criando…" : "Adicionar à equipe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
