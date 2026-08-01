import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { Card, CardContent } from "@/components/ui/card";
import type { NovaVendaFormState } from "./form-state";
import type { VendedorOpcao } from "./types";

const GARANTIAS = ["Nota promissória", "Alienação fiduciária", "Nenhuma"] as const;

const DOCUMENTOS = [
  {
    titulo: "Contrato de compra e venda",
    descricao: "Dados do veículo, cliente, valor e forma de pagamento.",
  },
  {
    titulo: "Recibo de pagamento",
    descricao: "Comprovante do valor pago no ato da venda.",
  },
  {
    titulo: "Carnê de parcelas",
    descricao: "Só se aplica quando há crediário próprio nesta venda.",
  },
];

export function DocumentosStep({
  form,
  patch,
  vendedores,
}: {
  form: NovaVendaFormState;
  patch: (p: Partial<NovaVendaFormState>) => void;
  vendedores: VendedorOpcao[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Vendedor responsável" htmlFor="vendedorId">
          <NativeSelect
            id="vendedorId"
            value={form.vendedorId}
            onChange={(e) => patch({ vendedorId: e.target.value })}
          >
            {vendedores.map((v) => (
              <NativeSelectOption key={v.id} value={v.id}>
                {v.nome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Comissão (%)" htmlFor="comissaoPct">
          <Input
            id="comissaoPct"
            type="number"
            step="0.1"
            value={form.comissaoPct}
            onChange={(e) => patch({ comissaoPct: e.target.value })}
          />
        </FormField>
        <FormField label="Garantia" htmlFor="garantia">
          <NativeSelect
            id="garantia"
            value={form.garantia}
            onChange={(e) => patch({ garantia: e.target.value })}
          >
            {GARANTIAS.map((g) => (
              <NativeSelectOption key={g} value={g}>
                {g}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField label="Observações" htmlFor="observacoes">
        <Textarea
          id="observacoes"
          rows={3}
          value={form.observacoes}
          onChange={(e) => patch({ observacoes: e.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Nesta fase os documentos aparecem como resumo em tela — geração de PDF fica para uma
          fase futura.
        </p>
        {DOCUMENTOS.map((doc) => (
          <Card key={doc.titulo}>
            <CardContent className="py-3">
              <p className="text-sm font-medium">{doc.titulo}</p>
              <p className="text-xs text-muted-foreground">{doc.descricao}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
