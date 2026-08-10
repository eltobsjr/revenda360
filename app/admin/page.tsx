import Link from "next/link";
import { Building2 } from "lucide-react";
import { listTenants } from "@/lib/data/admin";
import { buttonVariants } from "@/components/ui/button";
import { ExcluirRevendaDialog } from "@/components/features/admin/excluir-revenda-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default async function AdminPage() {
  const tenants = await listTenants();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Revendas</h1>
          <p className="text-sm text-muted-foreground">
            {tenants.length} revenda{tenants.length === 1 ? "" : "s"} provisionada
            {tenants.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin/revendas/nova" className={buttonVariants()}>
          <Building2 />
          Nova revenda
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{t.plano}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.criado_em).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ExcluirRevendaDialog tenantId={t.id} nomeRevenda={t.nome} />
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
