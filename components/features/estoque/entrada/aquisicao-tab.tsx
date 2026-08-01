import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import type { VeiculoFormState } from "./form-state";

const ORIGENS = [
  "Compra de particular",
  "Troca",
  "Leilão",
  "Repasse de outra loja",
  "Consignado",
] as const;

export function AquisicaoTab({
  form,
  patch,
  lojas,
}: {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
  lojas: { id: string; nome: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <FormField label="Data de entrada" htmlFor="dataEntrada">
        <Input
          id="dataEntrada"
          type="date"
          value={form.dataEntrada}
          onChange={(e) => patch({ dataEntrada: e.target.value })}
          required
        />
      </FormField>
      <FormField label="Origem" htmlFor="origem">
        <NativeSelect
          id="origem"
          value={form.origem}
          onChange={(e) => patch({ origem: e.target.value as VeiculoFormState["origem"] })}
        >
          {ORIGENS.map((o) => (
            <NativeSelectOption key={o} value={o}>
              {o}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Fornecedor/proprietário anterior" htmlFor="fornecedor">
        <Input
          id="fornecedor"
          value={form.fornecedor}
          onChange={(e) => patch({ fornecedor: e.target.value })}
        />
      </FormField>
      <FormField label="Valor de compra" htmlFor="valorCompra">
        <Input
          id="valorCompra"
          type="number"
          value={form.valorCompra}
          onChange={(e) => patch({ valorCompra: e.target.value })}
          required
        />
      </FormField>
      <FormField label="Forma de pagamento da compra" htmlFor="formaPagCompra">
        <Input
          id="formaPagCompra"
          value={form.formaPagCompra}
          onChange={(e) => patch({ formaPagCompra: e.target.value })}
          placeholder="PIX, dinheiro, transferência..."
        />
      </FormField>
      {lojas.length > 1 ? (
        <FormField label="Loja/pátio" htmlFor="lojaId">
          <NativeSelect
            id="lojaId"
            value={form.lojaId}
            onChange={(e) => patch({ lojaId: e.target.value })}
          >
            {lojas.map((l) => (
              <NativeSelectOption key={l.id} value={l.id}>
                {l.nome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      ) : null}
    </div>
  );
}
