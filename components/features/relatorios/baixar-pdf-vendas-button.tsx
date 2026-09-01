"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VendasRecebiveisPdf } from "./vendas-recebiveis-pdf";
import { ContasPagarPdf } from "./contas-pagar-pdf";
import type { ParcelaRow } from "@/lib/data/contas-receber";
import type { ContaPagarRow } from "@/lib/data/contas-pagar";
import type { StatusParcela } from "@/lib/domain/juros";
import { dentroDoPeriodoDeRelatorio } from "@/lib/domain/relatorio-periodo";

type Opcao = "geral" | "pagar" | "pagas" | "vencidas" | "avencer";
type ModoPeriodo = "mensal" | "personalizado";

const OPCOES: { id: Opcao; label: string; status?: StatusParcela; arquivo: string }[] = [
  { id: "geral", label: "Relatório geral (todos os status)", arquivo: "vendas-recebiveis" },
  { id: "pagar", label: "Somente contas a pagar", arquivo: "contas-a-pagar" },
  { id: "pagas", label: "A receber — pagas", status: "Paga", arquivo: "a-receber-pagas" },
  { id: "vencidas", label: "A receber — vencidas", status: "Atrasada", arquivo: "a-receber-vencidas" },
  { id: "avencer", label: "A receber — a vencer", status: "A vencer", arquivo: "a-receber-a-vencer" },
];

function mesAtualIso(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

/** Primeiro e último dia (ISO) do mês informado no formato "YYYY-MM". */
function limitesDoMes(mesIso: string): { inicio: string; fim: string } {
  const [ano, mes] = mesIso.split("-").map(Number);
  const inicio = `${mesIso}-01`;
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);
  return { inicio, fim };
}

export function BaixarPdfVendasButton({
  parcelas,
  contasPagar,
}: {
  parcelas: ParcelaRow[];
  contasPagar: ContaPagarRow[];
}) {
  const [open, setOpen] = useState(false);
  const [gerando, setGerando] = useState<Opcao | null>(null);
  const [modoPeriodo, setModoPeriodo] = useState<ModoPeriodo>("mensal");
  const [mes, setMes] = useState(mesAtualIso());
  const limitesMesAtual = limitesDoMes(mesAtualIso());
  const [dataInicial, setDataInicial] = useState(limitesMesAtual.inicio);
  const [dataFinal, setDataFinal] = useState(limitesMesAtual.fim);

  const periodo = modoPeriodo === "mensal" ? limitesDoMes(mes) : { inicio: dataInicial, fim: dataFinal };

  async function baixar(opcao: Opcao) {
    setGerando(opcao);
    try {
      const definicao = OPCOES.find((o) => o.id === opcao)!;
      let blob: Blob;

      if (opcao === "pagar") {
        const filtradas = contasPagar.filter((c) =>
          dentroDoPeriodoDeRelatorio(c.vencimento, c.status, periodo),
        );
        blob = await pdf(<ContasPagarPdf contas={filtradas} periodo={periodo} />).toBlob();
      } else {
        const filtradas = parcelas.filter((p) => {
          if (!dentroDoPeriodoDeRelatorio(p.vencimento, p.status, periodo)) return false;
          if (definicao.status && p.status !== definicao.status) return false;
          return true;
        });
        blob = await pdf(
          <VendasRecebiveisPdf parcelas={filtradas} titulo={definicao.label} periodo={periodo} />,
        ).toBlob();
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${definicao.arquivo}-${periodo.inicio}-a-${periodo.fim}.pdf`;
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

        <div className="flex flex-col gap-3">
          <div className="flex overflow-hidden rounded-md border border-border w-fit">
            <button
              type="button"
              onClick={() => setModoPeriodo("mensal")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                modoPeriodo === "mensal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setModoPeriodo("personalizado")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors",
                modoPeriodo === "personalizado"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              Data inicial a final
            </button>
          </div>

          {modoPeriodo === "mensal" ? (
            <FormField label="Mês" htmlFor="pdf-mes">
              <Input id="pdf-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
            </FormField>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="De" htmlFor="pdf-data-inicial">
                <Input
                  id="pdf-data-inicial"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                />
              </FormField>
              <FormField label="Até" htmlFor="pdf-data-final">
                <Input
                  id="pdf-data-final"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                />
              </FormField>
            </div>
          )}
        </div>

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
