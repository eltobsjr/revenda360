"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VendasRecebiveisPdf, situacaoDoContrato } from "./vendas-recebiveis-pdf";
import { ContasPagarPdf } from "./contas-pagar-pdf";
import type { ContratoRelatorioLinha } from "@/lib/data/relatorios";
import type { ContaPagarRow } from "@/lib/data/contas-pagar";

type Opcao = "geral" | "pagar" | "pagas" | "vencidas";

const OPCOES: { id: Opcao; label: string }[] = [
  { id: "geral", label: "Relatório geral (todos os contratos)" },
  { id: "pagar", label: "Somente contas a pagar" },
  { id: "pagas", label: "A receber — pagas" },
  { id: "vencidas", label: "A receber — vencidas" },
];

export function BaixarPdfVendasButton({
  linhas,
  contasPagar,
}: {
  linhas: ContratoRelatorioLinha[];
  contasPagar: ContaPagarRow[];
}) {
  const [open, setOpen] = useState(false);
  const [gerando, setGerando] = useState<Opcao | null>(null);

  async function baixar(opcao: Opcao) {
    setGerando(opcao);
    try {
      let blob: Blob;
      let nomeArquivo: string;

      if (opcao === "pagar") {
        blob = await pdf(<ContasPagarPdf contas={contasPagar} />).toBlob();
        nomeArquivo = "contas-a-pagar";
      } else {
        const filtradas =
          opcao === "pagas"
            ? linhas.filter((l) => situacaoDoContrato(l) === "Paga")
            : opcao === "vencidas"
              ? linhas.filter((l) => situacaoDoContrato(l) === "Atrasada")
              : linhas;
        const titulo =
          opcao === "pagas"
            ? "Vendas & Recebíveis — Pagas"
            : opcao === "vencidas"
              ? "Vendas & Recebíveis — Vencidas"
              : "Vendas & Recebíveis";
        blob = await pdf(<VendasRecebiveisPdf linhas={filtradas} titulo={titulo} />).toBlob();
        nomeArquivo =
          opcao === "pagas" ? "a-receber-pagas" : opcao === "vencidas" ? "a-receber-vencidas" : "vendas-recebiveis";
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } finally {
      setGerando(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>Baixar PDF</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixar PDF</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {OPCOES.map((o) => (
            <Button
              key={o.id}
              type="button"
              variant="outline"
              className="justify-start"
              disabled={gerando !== null}
              onClick={() => baixar(o.id)}
            >
              {gerando === o.id ? "Gerando…" : o.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
