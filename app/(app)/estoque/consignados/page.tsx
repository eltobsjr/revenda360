import { getCurrentProfile } from "@/lib/auth/session";
import { listConsignacoesDisponiveis, listConsignacoesVendidas } from "@/lib/data/consignacoes";
import { formatBRL, formatDataBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default async function ConsignadosPage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";
  // Repasse/comissão são dado financeiro equivalente a custo/margem — mesmo
  // critério de ocultação de lib/data/veiculos.ts, só gestor vê.
  const mostrarFinanceiro = role === "gestor";

  const [disponiveis, vendidos] = await Promise.all([
    listConsignacoesDisponiveis(),
    listConsignacoesVendidas(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Consignados</h1>
        <p className="text-sm text-muted-foreground">
          Veículos de terceiros à venda na revenda, com repasse combinado ao consignante.
          Cadastre um novo pela Entrada de veículo, escolhendo origem &quot;Consignado&quot;.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Disponíveis ({disponiveis.length})</h2>
        {disponiveis.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum consignado disponível.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Consignante</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Preço de venda</TableHead>
                    {mostrarFinanceiro ? (
                      <TableHead className="text-right">Repasse combinado</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disponiveis.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.veiculo}
                        <span className="block text-xs text-muted-foreground">{c.placa}</span>
                      </TableCell>
                      <TableCell>{c.consignanteNome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.consignanteContato ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(c.precoVenda)}
                      </TableCell>
                      {mostrarFinanceiro ? (
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatBRL(c.valorRepasse)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Vendidos ({vendidos.length})</h2>
        {vendidos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum consignado vendido ainda.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Consignante</TableHead>
                    <TableHead>Data da venda</TableHead>
                    <TableHead className="text-right">Valor da venda</TableHead>
                    {mostrarFinanceiro ? <TableHead className="text-right">Repasse</TableHead> : null}
                    {mostrarFinanceiro ? (
                      <TableHead className="text-right">Comissão da revenda</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendidos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.veiculo}
                        <span className="block text-xs text-muted-foreground">{c.placa}</span>
                      </TableCell>
                      <TableCell>{c.consignanteNome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDataBR(c.dataVenda)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(c.valorVenda)}
                      </TableCell>
                      {mostrarFinanceiro ? (
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatBRL(c.valorRepasse)}
                        </TableCell>
                      ) : null}
                      {mostrarFinanceiro ? (
                        <TableCell className="text-right tabular-nums font-semibold text-success">
                          {formatBRL(c.comissaoRevenda)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
