"use client";

import { useActionState } from "react";
import { marcarComissaoPaga } from "@/app/(app)/financeiro/comissoes/actions";
import { COMISSAO_INITIAL_STATE } from "@/app/(app)/financeiro/comissoes/comissao-state";
import { Button } from "@/components/ui/button";

export function MarcarPagaButton({ vendaId }: { vendaId: string }) {
  const [state, formAction, pending] = useActionState(marcarComissaoPaga, COMISSAO_INITIAL_STATE);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="vendaId" value={vendaId} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Marcando…" : "Marcar como paga"}
      </Button>
      {state.error ? <span className="text-xs text-destructive">{state.error}</span> : null}
    </form>
  );
}
