import { getCurrentProfile } from "@/lib/auth/session";
import { listMembrosEquipe, listLojas } from "@/lib/data/equipe";
import { EquipeForm } from "@/components/features/equipe/equipe-form";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  gestor: "Gestor",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
};

export default async function EquipePage() {
  const [profile, membros, lojas] = await Promise.all([
    getCurrentProfile(),
    listMembrosEquipe(),
    listLojas(),
  ]);

  const isGestor = profile?.role === "gestor";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Quem tem acesso ao Revenda 360 na sua revenda.
        </p>
      </div>

      {isGestor ? <EquipeForm lojas={lojas} /> : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membros.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {ROLE_LABEL[m.role] ?? m.role}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.ativo
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-muted-foreground/20 bg-muted text-muted-foreground"
                      }
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
                    </Badge>
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
