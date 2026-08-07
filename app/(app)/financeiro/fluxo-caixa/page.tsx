import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getFluxoCaixa } from "@/lib/data/fluxo-caixa";
import { formatBRL } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function FluxoCaixaPage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  // Mesmo critério de Contas a pagar (Fase 11): informação financeira interna.
  if (role === "vendedor") redirect("/dashboard");

  const meses = await getFluxoCaixa(12);
  const totalEntradas = meses.reduce((soma, m) => soma + m.entradas, 0);
  const totalSaidas = meses.reduce((soma, m) => soma + m.saidas, 0);
  const saldoFinal = meses.at(-1)?.saldoAcumulado ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Fluxo de caixa</h1>
        <p className="text-sm text-muted-foreground">Entradas e saídas dos últimos 12 meses.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Entradas (12 meses)</p>
            <p className="text-lg font-semibold text-success">{formatBRL(totalEntradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Saídas (12 meses)</p>
            <p className="text-lg font-semibold text-destructive">{formatBRL(totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Saldo acumulado</p>
            <p className={cn("text-lg font-semibold", saldoFinal >= 0 ? "text-success" : "text-destructive")}>
              {formatBRL(saldoFinal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo do mês</TableHead>
                <TableHead className="text-right">Saldo acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meses.map((m) => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">
                    {formatBRL(m.entradas)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">
                    {formatBRL(m.saidas)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      m.saldoMes >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatBRL(m.saldoMes)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      m.saldoAcumulado >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatBRL(m.saldoAcumulado)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
