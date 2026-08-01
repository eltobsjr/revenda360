import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";

export function ConfirmacaoStep({
  veiculoResumo,
  clienteResumo,
  vendedorNome,
  total,
  lucro,
  avisos,
  garantia,
  onConfirmar,
  pending,
  erro,
}: {
  veiculoResumo: string;
  clienteResumo: string;
  vendedorNome: string;
  total: number;
  lucro: number | null;
  avisos: string[];
  garantia: string;
  onConfirmar: () => void;
  pending: boolean;
  erro: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y rounded-md border">
        <ResumoLinha label="Veículo" valor={veiculoResumo} />
        <ResumoLinha label="Cliente" valor={clienteResumo} />
        <ResumoLinha label="Vendedor" valor={vendedorNome} />
        <ResumoLinha label="Garantia" valor={garantia || "—"} />
        <ResumoLinha label="Valor final" valor={formatBRL(total)} destaque />
        {lucro != null ? (
          <ResumoLinha label="Lucro da operação" valor={formatBRL(lucro)} destaque />
        ) : null}
      </div>

      {avisos.map((aviso) => (
        <p key={aviso} className="text-sm text-destructive">
          {aviso}
        </p>
      ))}

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      <Button
        type="button"
        onClick={onConfirmar}
        disabled={pending || avisos.length > 0}
        className="self-start"
      >
        {pending ? "Confirmando…" : "Confirmar venda"}
      </Button>
    </div>
  );
}

function ResumoLinha({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={destaque ? "text-base font-semibold" : "font-medium"}>{valor}</span>
    </div>
  );
}
