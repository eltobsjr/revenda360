import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { VeiculoStatusBadge } from "./veiculo-status-badge";
import { formatBRL, formatInt } from "@/lib/format";
import type { VeiculoComFinanceiro } from "@/lib/data/veiculos";

export function VeiculoTabela({
  veiculos,
  diasAlertaEstoqueParado,
  mostrarFinanceiro,
}: {
  veiculos: VeiculoComFinanceiro[];
  diasAlertaEstoqueParado: number;
  mostrarFinanceiro: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Veículo</TableHead>
          <TableHead>Ano</TableHead>
          <TableHead>Placa</TableHead>
          <TableHead>KM</TableHead>
          <TableHead>Cor</TableHead>
          {mostrarFinanceiro ? <TableHead className="text-right">Compra</TableHead> : null}
          <TableHead className="text-right">Venda</TableHead>
          {mostrarFinanceiro ? <TableHead className="text-right">Margem</TableHead> : null}
          <TableHead className="text-right">Dias</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {veiculos.map((v) => {
          const parado = v.dias_estoque > diasAlertaEstoqueParado;
          return (
            <TableRow key={v.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link href={`/estoque/${v.id}`} className="hover:underline">
                  {v.marca} {v.modelo}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {v.versao || "—"}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">
                {v.ano_fab}/{v.ano_mod}
              </TableCell>
              <TableCell className="tabular-nums">{v.placa}</TableCell>
              <TableCell className="tabular-nums">{formatInt(v.km)}</TableCell>
              <TableCell>{v.cor}</TableCell>
              {mostrarFinanceiro ? (
                <TableCell className="tabular-nums text-right">
                  {formatBRL(v.valor_compra)}
                </TableCell>
              ) : null}
              <TableCell className="tabular-nums text-right font-medium">
                {formatBRL(v.preco_venda)}
              </TableCell>
              {mostrarFinanceiro ? (
                <TableCell className="tabular-nums text-right">
                  {v.margem_pct.toFixed(1)}%
                </TableCell>
              ) : null}
              <TableCell
                className={`tabular-nums text-right ${parado ? "font-medium text-warning" : ""}`}
              >
                {v.dias_estoque}
              </TableCell>
              <TableCell>
                <VeiculoStatusBadge status={v.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
