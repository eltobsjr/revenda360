import { getCurrentProfile } from "@/lib/auth/session";
import { listPropostas } from "@/lib/data/propostas";
import { listVeiculos } from "@/lib/data/veiculos";
import { listClientes } from "@/lib/data/clientes";
import { formatBRL, formatDataBR } from "@/lib/format";
import { NovaPropostaDialog } from "@/components/features/propostas/nova-proposta-dialog";
import { PropostaStatusBadge } from "@/components/features/propostas/proposta-status-badge";
import { PropostaAcoes } from "@/components/features/propostas/proposta-acoes";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default async function PropostasPage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const [propostas, veiculos, clientes] = await Promise.all([
    listPropostas(),
    listVeiculos(role, { status: ["Disponível", "Consignado"] }),
    listClientes(role),
  ]);

  const opcoesVeiculos = veiculos.map((v) => ({ id: v.id, nome: `${v.marca} ${v.modelo}` }));
  const opcoesClientes = clientes.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Propostas</h1>
          <p className="text-sm text-muted-foreground">
            {propostas.length} proposta{propostas.length === 1 ? "" : "s"} registrada
            {propostas.length === 1 ? "" : "s"}.
          </p>
        </div>
        <NovaPropostaDialog veiculos={opcoesVeiculos} clientes={opcoesClientes} />
      </div>

      {propostas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhuma proposta registrada</p>
            <p className="text-sm text-muted-foreground">Cadastre a primeira proposta pra um cliente.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor proposto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propostas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.veiculo}
                      <span className="block text-xs text-muted-foreground">{p.placa}</span>
                    </TableCell>
                    <TableCell>{p.cliente}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(p.valorProposto)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.validade ? formatDataBR(p.validade) : "—"}
                    </TableCell>
                    <TableCell>
                      <PropostaStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      <PropostaAcoes proposta={p} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
