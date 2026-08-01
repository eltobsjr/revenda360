import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";

export function FinanceiroTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  const somaCustos = veiculo.custos.reduce((total, c) => total + c.valor, 0);
  const vendido = veiculo.status === "Vendido";
  const lucroReal = vendido ? veiculo.margem_r : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Valor de compra</p>
          <p className="tabular-nums text-sm font-medium">{formatBRL(veiculo.valor_compra)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Custos lançados</p>
          <p className="tabular-nums text-sm font-medium">{formatBRL(somaCustos)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Custo total</p>
          <p className="tabular-nums text-sm font-medium">{formatBRL(veiculo.custo_total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Preço mínimo</p>
          <p className="tabular-nums text-sm font-medium">{formatBRL(veiculo.preco_minimo)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 rounded-md border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Preço de venda</p>
          <p className="tabular-nums text-lg font-semibold">{formatBRL(veiculo.preco_venda)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {vendido ? "Lucro real (mini-DRE)" : "Margem prevista"}
          </p>
          <p className="tabular-nums text-lg font-semibold text-success">
            {formatBRL(lucroReal ?? veiculo.margem_r)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Margem %</p>
          <p className="tabular-nums text-lg font-semibold">{veiculo.margem_pct.toFixed(1)}%</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Custos lançados
        </p>
        {veiculo.custos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum custo lançado para este veículo.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculo.custos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.categoria}</TableCell>
                  <TableCell className="text-muted-foreground">{c.descricao || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.fornecedor || "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatDataBR(c.data)}</TableCell>
                  <TableCell className="tabular-nums text-right">{formatBRL(c.valor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total de custos</TableCell>
                <TableCell className="tabular-nums text-right">{formatBRL(somaCustos)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>
    </div>
  );
}
