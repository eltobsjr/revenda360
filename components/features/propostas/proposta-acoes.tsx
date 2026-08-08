"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarStatusProposta, converterPropostaEmVenda } from "@/app/(app)/vendas/propostas/actions";
import { Button } from "@/components/ui/button";
import { BaixarPdfButton } from "./baixar-pdf-button";
import type { PropostaRow } from "@/lib/data/propostas";

export function PropostaAcoes({ proposta }: { proposta: PropostaRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function marcarStatus(status: "Aceita" | "Recusada") {
    startTransition(async () => {
      const resultado = await atualizarStatusProposta(proposta.id, status);
      if (resultado.error) setErro(resultado.error);
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
      } else {
        setErro(resultado.error ?? "Não foi possível converter a proposta em venda.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
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
    </div>
  );
}
