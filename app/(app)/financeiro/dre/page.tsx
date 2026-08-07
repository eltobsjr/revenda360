import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { listDrePorVeiculo } from "@/lib/data/dre";
import { formatBRL, formatDataBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicial?: string; dataFinal?: string }>;
}) {
  const { dataInicial, dataFinal } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  // Informação financeira mais sensível do sistema — 100% gestor, nem financeiro/vendedor veem.
  if (role !== "gestor") redirect("/dashboard");

  const hoje = new Date();
  const inicioPadrao = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1).toISOString().slice(0, 10);
  const filtroInicial = dataInicial || inicioPadrao;
  const filtroFinal = dataFinal || hoje.toISOString().slice(0, 10);

  const linhas = await listDrePorVeiculo(filtroInicial, filtroFinal);
  const totalPrecoVenda = linhas.reduce((soma, l) => soma + l.precoVenda, 0);
  const totalCustoAquisicao = linhas.reduce((soma, l) => soma + l.custoAquisicao, 0);
  const totalCustosLancados = linhas.reduce((soma, l) => soma + l.custosLancados, 0);
  const totalComissao = linhas.reduce((soma, l) => soma + l.comissao, 0);
  const totalRepasse = linhas.reduce((soma, l) => soma + l.repasseConsignacao, 0);
  const totalMargem = linhas.reduce((soma, l) => soma + l.margemR, 0);
  const temConsignacao = linhas.some((l) => l.repasseConsignacao > 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">DRE por veículo</h1>
        <p className="text-sm text-muted-foreground">
          Margem realizada de cada venda confirmada no período.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/financeiro/dre">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dataInicial" className="text-xs font-medium text-muted-foreground">
            De
          </label>
          <Input
            id="dataInicial"
            name="dataInicial"
            type="date"
            defaultValue={filtroInicial}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dataFinal" className="text-xs font-medium text-muted-foreground">
            Até
          </label>
          <Input id="dataFinal" name="dataFinal" type="date" defaultValue={filtroFinal} className="w-40" />
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {linhas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhuma venda confirmada no período</p>
            <p className="text-sm text-muted-foreground">Ajuste o filtro de data.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Preço de venda</TableHead>
                  <TableHead className="text-right">Custo de aquisição</TableHead>
                  <TableHead className="text-right">Custos lançados</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  {temConsignacao ? (
                    <TableHead className="text-right">Repasse consignação</TableHead>
                  ) : null}
                  <TableHead className="text-right">Margem R$</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.map((l) => (
                  <TableRow key={l.vendaId}>
                    <TableCell className="font-medium">
                      {l.veiculo}
                      <span className="block text-xs text-muted-foreground">{l.placa}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDataBR(l.dataVenda)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(l.precoVenda)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(l.custoAquisicao)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(l.custosLancados)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(l.comissao)}
                    </TableCell>
                    {temConsignacao ? (
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {l.repasseConsignacao > 0 ? formatBRL(l.repasseConsignacao) : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-semibold",
                        l.margemR >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatBRL(l.margemR)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        l.margemPct >= 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {l.margemPct.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2}>Totais</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(totalPrecoVenda)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(totalCustoAquisicao)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(totalCustosLancados)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(totalComissao)}</TableCell>
                  {temConsignacao ? (
                    <TableCell className="text-right tabular-nums">{formatBRL(totalRepasse)}</TableCell>
                  ) : null}
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-semibold",
                      totalMargem >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatBRL(totalMargem)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
