import { getCurrentProfile } from "@/lib/auth/session";
import { listClientes } from "@/lib/data/clientes";
import { ClienteQuickCreate } from "@/components/features/clientes/cliente-quick-create";
import { ClientesTabela } from "@/components/features/clientes/clientes-tabela";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";
  const mostrarCpf = role === "gestor";
  const clientes = await listClientes(role, busca);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} cadastrado
            {clientes.length === 1 ? "" : "s"}.
          </p>
        </div>
        <ClienteQuickCreate />
      </div>

      <form className="flex items-end gap-3" action="/clientes">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="busca" className="text-xs font-medium text-muted-foreground">
            Buscar
          </label>
          <Input
            id="busca"
            name="busca"
            placeholder={mostrarCpf ? "Nome ou CPF" : "Nome"}
            defaultValue={busca}
            className="w-64"
          />
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <ClientesTabela clientes={clientes} mostrarCpf={mostrarCpf} />
        </CardContent>
      </Card>
    </div>
  );
}
