import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import type { VeiculoFormState } from "./form-state";

export function ObservacoesTab({
  form,
  patch,
}: {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
}) {
  return (
    <FormField label="Observações" htmlFor="observacoes">
      <Textarea
        id="observacoes"
        value={form.observacoes}
        onChange={(e) => patch({ observacoes: e.target.value })}
        rows={6}
        placeholder="Pendências internas, observações da equipe..."
      />
    </FormField>
  );
}
