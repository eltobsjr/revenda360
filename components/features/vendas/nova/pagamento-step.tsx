"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { formatBRL } from "@/lib/format";
import { numero } from "./form-state";
import type { NovaVendaFormState } from "./form-state";

export function PagamentoStep({
  form,
  patch,
}: {
  form: NovaVendaFormState;
  patch: (p: Partial<NovaVendaFormState>) => void;
}) {
  const total = numero(form.valorVenda) - numero(form.desconto);
  const troca = form.temTroca ? numero(form.trocaValor) : 0;
  const entrada = numero(form.pagEntradaValor);
  const financiamento = numero(form.pagFinanciamento);
  const crediario = numero(form.pagCrediario);
  const soma = troca + entrada + financiamento + crediario;
  const falta = Math.round((total - soma) * 100) / 100;

  const composicaoCompleta = Math.abs(falta) < 0.5;
  const label = composicaoCompleta
    ? "Composição completa"
    : falta > 0
      ? "Falta compor"
      : "Valor excedente";

  return (
    <div className="flex flex-col gap-4">
      {form.temTroca ? (
        <div className="flex items-center justify-between border-b pb-2 text-sm">
          <span className="text-muted-foreground">Veículo na troca</span>
          <span className="tabular-nums font-medium">{formatBRL(troca)}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Entrada / à vista" htmlFor="pagEntradaValor">
          <Input
            id="pagEntradaValor"
            type="number"
            value={form.pagEntradaValor}
            onChange={(e) => patch({ pagEntradaValor: e.target.value })}
          />
        </FormField>
        <FormField label="Forma de pagamento da entrada" htmlFor="pagEntradaForma">
          <NativeSelect
            id="pagEntradaForma"
            value={form.pagEntradaForma}
            onChange={(e) =>
              patch({
                pagEntradaForma: e.target.value as NovaVendaFormState["pagEntradaForma"],
              })
            }
          >
            <NativeSelectOption value="dinheiro">Dinheiro</NativeSelectOption>
            <NativeSelectOption value="pix">PIX</NativeSelectOption>
            <NativeSelectOption value="cartao">Cartão</NativeSelectOption>
            <NativeSelectOption value="transferencia">Transferência</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Financiamento bancário" htmlFor="pagFinanciamento">
          <Input
            id="pagFinanciamento"
            type="number"
            value={form.pagFinanciamento}
            onChange={(e) => patch({ pagFinanciamento: e.target.value })}
          />
        </FormField>
        <FormField label="Crediário próprio / carnê da loja" htmlFor="pagCrediario">
          <Input
            id="pagCrediario"
            type="number"
            value={form.pagCrediario}
            onChange={(e) => patch({ pagCrediario: e.target.value })}
          />
        </FormField>
      </div>

      <div
        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium ${
          composicaoCompleta
            ? "border-success/30 bg-success/10 text-success"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
      >
        <span>{label}</span>
        <span className="tabular-nums">{formatBRL(Math.abs(falta))}</span>
      </div>
    </div>
  );
}
