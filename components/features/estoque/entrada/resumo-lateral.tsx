import { custoTotal, margemR, margemPct } from "@/lib/domain/pricing";
import { formatBRL } from "@/lib/format";
import { numero, type VeiculoFormState } from "./form-state";

export function ResumoLateral({ form }: { form: VeiculoFormState }) {
  const valorCompra = numero(form.valorCompra);
  const somaCustos = form.custos.reduce((total, c) => total + numero(c.valor), 0);
  const precoVenda = numero(form.precoVenda);

  const custoTotalCalc = custoTotal(valorCompra, [somaCustos]);
  const margemRCalc = margemR(precoVenda, custoTotalCalc);
  const margemPctCalc = margemPct(margemRCalc, precoVenda);

  return (
    <div className="sticky top-4 flex flex-col gap-3 rounded-md border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Resumo financeiro
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Custo total</span>
        <span className="tabular-nums font-medium">{formatBRL(custoTotalCalc)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Preço de venda</span>
        <span className="tabular-nums font-medium">{formatBRL(precoVenda)}</span>
      </div>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Margem</span>
        <span
          className={`tabular-nums font-semibold ${margemRCalc >= 0 ? "text-success" : "text-destructive"}`}
        >
          {formatBRL(margemRCalc)} ({margemPctCalc.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
