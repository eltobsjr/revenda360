"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarStatusProposta, converterPropostaEmVenda } from "@/app/(app)/vendas/propostas/actions";
import { Button } from "@/components/ui/button";
import { BaixarPdfButton } from "./baixar-pdf-button";
import type { PropostaRow } from "@/lib/data/propostas";

export function PropostaAcoes({ proposta }: { proposta: PropostaRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function marcarStatus(status: "Aceita" | "Recusada") {
    startTransition(async () => {
      await atualizarStatusProposta(proposta.id, status);
    });
  }

  function converter() {
    startTransition(async () => {
      const resultado = await converterPropostaEmVenda(proposta.id);
      if (resultado.clienteId && resultado.veiculoId) {
        const params = new URLSearchParams({
          clienteId: resultado.clienteId,
          veiculoId: resultado.veiculoId,
          valorVenda: String(resultado.valorProposto ?? ""),
        });
        router.push(`/vendas/nova?${params.toString()}`);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {proposta.status === "Em aberto" ? (
        <>
          <Button type="button" size="sm" disabled={pending} onClick={() => marcarStatus("Aceita")}>
            Aceita
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => marcarStatus("Recusada")}
          >
            Recusada
          </Button>
        </>
      ) : null}
      {proposta.status === "Aceita" ? (
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={converter}>
          {pending ? "Convertendo…" : "Converter em venda"}
        </Button>
      ) : null}
      <BaixarPdfButton proposta={proposta} />
    </div>
  );
}
