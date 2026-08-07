"use client";

import { useState, useTransition } from "react";
import { renegociarContrato } from "@/app/(app)/financeiro/receber/actions";
import { gerarParcelas } from "@/lib/domain/parcelas";
import { formatBRL, formatDataBR } from "@/lib/format";
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
import type { ContratoRow } from "@/lib/data/contas-receber";

function proximoMesIso(): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
  return d.toISOString().slice(0, 10);
}

export function RenegociarDialog({ contrato }: { contrato: ContratoRow }) {
  const [open, setOpen] = useState(false);
  const [qtdParcelas, setQtdParcelas] = useState("6");
  const [taxaJuros, setTaxaJuros] = useState("2.5");
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState(proximoMesIso());
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const qtd = Number(qtdParcelas) || 0;
  const taxa = Number(taxaJuros.replace(",", ".")) || 0;
  const previa =
    qtd > 0 && dataPrimeiroVenc ? gerarParcelas(contrato.saldo, taxa, qtd, dataPrimeiroVenc) : [];

  function confirmar() {
    if (qtd <= 0) {
      setErro("Informe uma quantidade de parcelas válida.");
      return;
    }
    if (!dataPrimeiroVenc) {
      setErro("Informe a data do primeiro vencimento.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await renegociarContrato({
        contratoId: contrato.id,
        qtdParcelas: qtd,
        taxaJurosMensal: taxa,
        dataPrimeiroVencimento: dataPrimeiroVenc,
        parcelas: previa,
      });
      if (resultado.error) {
        setErro(resultado.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        Renegociar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renegociar contrato — {contrato.cliente}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Saldo devedor atual: <strong className="text-foreground">{formatBRL(contrato.saldo)}</strong>.
            As parcelas não pagas do contrato atual ficam marcadas como renegociadas (sem apagar,
            fica no histórico); um novo carnê é gerado com os termos abaixo.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nova quantidade de parcelas" htmlFor="qtdParcelas">
              <Input
                id="qtdParcelas"
                type="number"
                value={qtdParcelas}
                onChange={(e) => setQtdParcelas(e.target.value)}
              />
            </FormField>
            <FormField label="Nova taxa de juros (% a.m.)" htmlFor="taxaJuros">
              <Input id="taxaJuros" value={taxaJuros} onChange={(e) => setTaxaJuros(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Nova data do primeiro vencimento" htmlFor="dataPrimeiroVenc">
            <Input
              id="dataPrimeiroVenc"
              type="date"
              value={dataPrimeiroVenc}
              onChange={(e) => setDataPrimeiroVenc(e.target.value)}
            />
          </FormField>

          {previa.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-md border p-2 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Novo carnê (prévia)</p>
              {previa.map((p) => (
                <div key={p.numero} className="flex justify-between">
                  <span>
                    Parcela {p.numero}/{previa.length} — {formatDataBR(p.vencimento)}
                  </span>
                  <span className="tabular-nums">{formatBRL(p.valor)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          <Button type="button" disabled={pending} onClick={confirmar}>
            {pending ? "Renegociando…" : "Confirmar renegociação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
