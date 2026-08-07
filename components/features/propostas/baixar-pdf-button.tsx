"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { PropostaPdf } from "./proposta-pdf";
import type { PropostaRow } from "@/lib/data/propostas";

export function BaixarPdfButton({ proposta }: { proposta: PropostaRow }) {
  const [gerando, setGerando] = useState(false);

  async function baixar() {
    setGerando(true);
    try {
      const blob = await pdf(<PropostaPdf proposta={proposta} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proposta-${proposta.veiculo.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGerando(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={baixar} disabled={gerando}>
      {gerando ? "Gerando…" : "Baixar PDF"}
    </Button>
  );
}
