"use client";

import { useActionState, useState } from "react";
import { excluirRevenda } from "@/app/admin/actions";
import { EXCLUIR_REVENDA_INITIAL_STATE } from "@/app/admin/excluir-revenda-state";
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

export function ExcluirRevendaDialog({ tenantId, nomeRevenda }: { tenantId: string; nomeRevenda: string }) {
  const [open, setOpen] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [state, formAction, pending] = useActionState(excluirRevenda, EXCLUIR_REVENDA_INITIAL_STATE);
  const [estadoTratado, setEstadoTratado] = useState(state);

  if (state !== estadoTratado) {
    setEstadoTratado(state);
    if (state.sucesso) setOpen(false);
  }

  const confirmacaoOk = confirmacao.trim() === nomeRevenda;

  return (
    <Dialog
      open={open}
      onOpenChange={(novoOpen) => {
        setOpen(novoOpen);
        if (!novoOpen) setConfirmacao("");
      }}
    >
      <DialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>Excluir</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir revenda — {nomeRevenda}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="tenantId" value={tenantId} />
          <p className="text-sm text-muted-foreground">
            Isso apaga <strong className="text-foreground">{nomeRevenda}</strong> por completo — estoque,
            vendas, clientes, financeiro, equipe, tudo. Não tem como desfazer. Pra confirmar, digite o nome
            exato da revenda abaixo.
          </p>
          <FormField label={`Digite "${nomeRevenda}" para confirmar`} htmlFor="nomeConfirmacao">
            <Input
              id="nomeConfirmacao"
              name="nomeConfirmacao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="off"
            />
          </FormField>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" variant="destructive" disabled={!confirmacaoOk || pending} className="w-full">
            {pending ? "Excluindo…" : "Excluir revenda definitivamente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
