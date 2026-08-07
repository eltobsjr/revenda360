import { getCurrentProfile } from "@/lib/auth/session";
import { listVendas } from "@/lib/data/vendas";
import { VendasTabela } from "@/components/features/vendas/realizadas/vendas-tabela";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import type { StatusVenda } from "@/types/database.types";

export default async function VendasRealizadasPage({
  searchParams,
}: {
  searchParams: Promise<{ dataInicial?: string; dataFinal?: string; status?: string }>;
}) {
  const { dataInicial, dataFinal, status } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";
  const mostrarComissao = role === "gestor";
  const statusFiltro: StatusVenda | undefined =
    status === "confirmada" || status === "cancelada" ? status : undefined;

  const vendas = await listVendas(role, { dataInicial, dataFinal, status: statusFiltro });

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Vendas realizadas</h1>
        <p className="text-sm text-muted-foreground">
          {vendas.length} venda{vendas.length === 1 ? "" : "s"} no período
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/vendas/realizadas">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dataInicial" className="text-xs font-medium text-muted-foreground">
            De
          </label>
          <Input
            id="dataInicial"
            name="dataInicial"
            type="date"
            defaultValue={dataInicial}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dataFinal" className="text-xs font-medium text-muted-foreground">
            Até
          </label>
          <Input id="dataFinal" name="dataFinal" type="date" defaultValue={dataFinal} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect id="status" name="status" defaultValue={statusFiltro ?? ""} className="w-40">
            <NativeSelectOption value="">Todos</NativeSelectOption>
            <NativeSelectOption value="confirmada">Confirmada</NativeSelectOption>
            <NativeSelectOption value="cancelada">Cancelada</NativeSelectOption>
          </NativeSelect>
        </div>
        <Button type="submit" size="sm">
          Filtrar
        </Button>
      </form>

      {vendas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhuma venda encontrada</p>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros ou feche uma venda pelo assistente de Nova venda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <VendasTabela vendas={vendas} mostrarComissao={mostrarComissao} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
