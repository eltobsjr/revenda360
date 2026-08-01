import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { custoTotal, margemR, margemPct } from "@/lib/domain/pricing";
import { formatBRL } from "@/lib/format";
import { numero, type VeiculoFormState } from "./form-state";

export function PrecificacaoTab({
  form,
  patch,
  isGestor,
}: {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
  isGestor: boolean;
}) {
  const valorCompra = numero(form.valorCompra);
  const somaCustos = form.custos.reduce((total, c) => total + numero(c.valor), 0);
  const valorFipe = numero(form.valorFipe);
  const precoVenda = numero(form.precoVenda);

  const custoTotalCalc = custoTotal(valorCompra, [somaCustos]);
  const margemRCalc = margemR(precoVenda, custoTotalCalc);
  const margemPctCalc = margemPct(margemRCalc, precoVenda);
  const pctVsFipe = valorFipe > 0 ? (precoVenda / valorFipe) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <FormField label="Valor FIPE" htmlFor="valorFipe">
          <Input
            id="valorFipe"
            type="number"
            value={form.valorFipe}
            onChange={(e) => patch({ valorFipe: e.target.value })}
          />
        </FormField>
        <FormField label="Preço de venda à vista" htmlFor="precoVenda">
          <Input
            id="precoVenda"
            type="number"
            value={form.precoVenda}
            onChange={(e) => patch({ precoVenda: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Preço no financiamento" htmlFor="precoFinanciamento">
          <Input
            id="precoFinanciamento"
            type="number"
            value={form.precoFinanciamento}
            onChange={(e) => patch({ precoFinanciamento: e.target.value })}
          />
        </FormField>
        {isGestor ? (
          <FormField label="Preço mínimo de negociação (só gestor)" htmlFor="precoMinimo">
            <Input
              id="precoMinimo"
              type="number"
              value={form.precoMinimo}
              onChange={(e) => patch({ precoMinimo: e.target.value })}
            />
          </FormField>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-md border p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">% em relação à FIPE</p>
          <p className="tabular-nums text-sm font-medium">
            {valorFipe > 0 ? `${pctVsFipe.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Custo total</p>
          <p className="tabular-nums text-sm font-medium">{formatBRL(custoTotalCalc)}</p>
        </div>
        {isGestor ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Margem prevista</p>
              <p
                className={`tabular-nums text-sm font-medium ${margemRCalc >= 0 ? "text-success" : "text-destructive"}`}
              >
                {formatBRL(margemRCalc)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem %</p>
              <p
                className={`tabular-nums text-sm font-medium ${margemRCalc >= 0 ? "text-success" : "text-destructive"}`}
              >
                {margemPctCalc.toFixed(1)}%
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
