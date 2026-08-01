import Link from "next/link";
import { Car, Bike } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VeiculoStatusBadge } from "./veiculo-status-badge";
import { formatBRL, formatInt } from "@/lib/format";
import type { VeiculoComFinanceiro } from "@/lib/data/veiculos";

export function VeiculoCard({
  veiculo,
  diasAlertaEstoqueParado,
}: {
  veiculo: VeiculoComFinanceiro;
  diasAlertaEstoqueParado: number;
}) {
  const parado = veiculo.dias_estoque > diasAlertaEstoqueParado;
  const Icone = veiculo.tipo === "carro" ? Car : Bike;

  return (
    <Link href={`/estoque/${veiculo.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icone className="size-10" />
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {veiculo.marca} {veiculo.modelo}
              </p>
              <p className="text-xs text-muted-foreground">
                {veiculo.versao || veiculo.ano_mod} · {veiculo.placa} · {formatInt(veiculo.km)} km
              </p>
            </div>
            <VeiculoStatusBadge status={veiculo.status} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="tabular-nums font-semibold">{formatBRL(veiculo.preco_venda)}</span>
            {veiculo.margem_pct !== undefined ? (
              <span className="tabular-nums text-xs text-muted-foreground">
                margem {veiculo.margem_pct.toFixed(1)}%
              </span>
            ) : null}
          </div>
          <p className={`text-xs ${parado ? "font-medium text-warning" : "text-muted-foreground"}`}>
            {veiculo.dias_estoque} dias em estoque{parado ? " — parado" : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
