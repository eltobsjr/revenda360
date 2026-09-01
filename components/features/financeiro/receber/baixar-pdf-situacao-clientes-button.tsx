"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { SituacaoClientesPdf } from "@/components/features/relatorios/situacao-clientes-pdf";
import { dataIsoLocal } from "@/lib/domain/datas";
import type { SituacaoClienteRow } from "@/lib/data/contas-receber";

export function BaixarPdfSituacaoClientesButton({ clientes }: { clientes: SituacaoClienteRow[] }) {
  const [gerando, setGerando] = useState(false);

  async function baixar() {
    setGerando(true);
    try {
      const blob = await pdf(<SituacaoClientesPdf clientes={clientes} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `situacao-clientes-${dataIsoLocal(new Date())}.pdf`;
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
