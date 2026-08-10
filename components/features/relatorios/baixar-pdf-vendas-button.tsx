"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { VendasRecebiveisPdf } from "./vendas-recebiveis-pdf";
import type { ContratoRelatorioLinha } from "@/lib/data/relatorios";

export function BaixarPdfVendasButton({ linhas }: { linhas: ContratoRelatorioLinha[] }) {
  const [gerando, setGerando] = useState(false);

  async function baixar() {
    setGerando(true);
    try {
      const blob = await pdf(<VendasRecebiveisPdf linhas={linhas} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendas-recebiveis-${new Date().toISOString().slice(0, 10)}.pdf`;
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
