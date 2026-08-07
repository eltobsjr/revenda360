import { listFornecedores } from "@/lib/data/fornecedores";
import { FornecedorDialog } from "@/components/features/fornecedores/fornecedor-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default async function FornecedoresPage() {
  const fornecedores = await listFornecedores();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            {fornecedores.length} fornecedor{fornecedores.length === 1 ? "" : "es"} cadastrado
            {fornecedores.length === 1 ? "" : "s"}.
          </p>
        </div>
        <FornecedorDialog triggerLabel="Novo fornecedor" />
      </div>

      {fornecedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhum fornecedor cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Cadastre um pra linkar aos veículos na Entrada de veículo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead className="text-right">Veículos</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{f.contato ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{f.cnpjCpf ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{f.qtdVeiculos}</TableCell>
                    <TableCell>
                      <FornecedorDialog fornecedor={f} triggerLabel="Editar" />
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
