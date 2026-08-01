"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { formatDataBR, formatBRL } from "@/lib/format";
import { numero } from "./form-state";
import type { NovaVendaFormState } from "./form-state";
import type { Parcela } from "@/lib/domain/parcelas";

export function CrediarioStep({
  form,
  patch,
  parcelas,
  onGerarParcelas,
  onEditarParcela,
}: {
  form: NovaVendaFormState;
  patch: (p: Partial<NovaVendaFormState>) => void;
  parcelas: Parcela[];
  onGerarParcelas: () => void;
  onEditarParcela: (numero: number, valor: string) => void;
}) {
  const crediario = numero(form.pagCrediario);

  if (crediario <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum valor foi composto em crediário próprio nesta venda — etapa não se aplica.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Nº de parcelas" htmlFor="crediarioQtd">
          <Input
            id="crediarioQtd"
            type="number"
            min={1}
            value={form.crediarioQtd}
            onChange={(e) => patch({ crediarioQtd: e.target.value })}
          />
        </FormField>
        <FormField label="Taxa de juros mensal (%)" htmlFor="crediarioTaxa">
          <Input
            id="crediarioTaxa"
            type="number"
            step="0.1"
            value={form.crediarioTaxa}
            onChange={(e) => patch({ crediarioTaxa: e.target.value })}
          />
        </FormField>
        <FormField label="1º vencimento" htmlFor="crediarioPrimeiroVenc">
          <Input
            id="crediarioPrimeiroVenc"
            type="date"
            value={form.crediarioPrimeiroVenc}
            onChange={(e) => patch({ crediarioPrimeiroVenc: e.target.value })}
          />
        </FormField>
      </div>

      <Button type="button" variant="outline" onClick={onGerarParcelas} className="self-start">
        Gerar parcelas
      </Button>

      {parcelas.length > 0 ? (
        <div className="flex flex-col gap-2">
          {parcelas.map((p) => (
            <div
              key={p.numero}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                Parcela {p.numero}/{parcelas.length} — {formatDataBR(p.vencimento)}
              </span>
              <Input
                type="number"
                value={p.valor}
                onChange={(e) => onEditarParcela(p.numero, e.target.value)}
                className="w-32"
              />
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
            <span>Total das parcelas</span>
            <span className="tabular-nums">
              {formatBRL(parcelas.reduce((soma, p) => soma + p.valor, 0))}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
