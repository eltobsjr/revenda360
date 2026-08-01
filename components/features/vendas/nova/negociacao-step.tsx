"use client";

import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import { precoMinimoEfetivo } from "@/lib/domain/pricing";
import { formatBRL } from "@/lib/format";
import { numero } from "./form-state";
import type { NovaVendaFormState } from "./form-state";
import type { VeiculoOpcao } from "./types";

export function NegociacaoStep({
  form,
  patch,
  veiculoSelecionado,
  margemMinimaPctDefault,
}: {
  form: NovaVendaFormState;
  patch: (p: Partial<NovaVendaFormState>) => void;
  veiculoSelecionado: VeiculoOpcao | undefined;
  margemMinimaPctDefault: number;
}) {
  const total = numero(form.valorVenda) - numero(form.desconto);
  const temDadosDeCusto =
    veiculoSelecionado != null &&
    "custo_total" in veiculoSelecionado &&
    veiculoSelecionado.custo_total != null;

  const minimo = temDadosDeCusto
    ? precoMinimoEfetivo(
        veiculoSelecionado!.preco_minimo,
        veiculoSelecionado!.custo_total,
        margemMinimaPctDefault,
      )
    : null;

  const abaixoDoMinimo = minimo != null && total > 0 && total < minimo;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Valor de venda" htmlFor="valorVenda">
          <Input
            id="valorVenda"
            type="number"
            value={form.valorVenda}
            onChange={(e) => patch({ valorVenda: e.target.value })}
          />
        </FormField>
        <FormField label="Desconto" htmlFor="desconto">
          <Input
            id="desconto"
            type="number"
            value={form.desconto}
            onChange={(e) => patch({ desconto: e.target.value })}
          />
        </FormField>
      </div>

      {abaixoDoMinimo ? (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          Valor final ({formatBRL(total)}) abaixo do mínimo recomendado ({formatBRL(minimo!)}).
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.temTroca}
          onCheckedChange={(checked) => patch({ temTroca: checked === true })}
        />
        Cliente vai dar um veículo na troca
      </label>

      {form.temTroca ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Veículo (descrição)" htmlFor="trocaDescricao">
            <Input
              id="trocaDescricao"
              placeholder="Ex.: Honda Pop 110i 2018"
              value={form.trocaDescricao}
              onChange={(e) => patch({ trocaDescricao: e.target.value })}
            />
          </FormField>
          <FormField label="Valor dado na troca" htmlFor="trocaValor">
            <Input
              id="trocaValor"
              type="number"
              value={form.trocaValor}
              onChange={(e) => patch({ trocaValor: e.target.value })}
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}
