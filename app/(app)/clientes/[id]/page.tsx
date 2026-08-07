import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCliente } from "@/lib/data/clientes";
import { listVendas } from "@/lib/data/vendas";
import { listParcelas } from "@/lib/data/contas-receber";
import { getTenantConfig } from "@/lib/data/tenant";
import { formatDataBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DadosTab } from "@/components/features/clientes/ficha/dados-tab";
import { VendasTabela } from "@/components/features/vendas/realizadas/vendas-tabela";
import { ParcelasTable } from "@/components/features/financeiro/receber/parcelas-table";

export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";
  const mostrarComissao = role === "gestor";

  const cliente = await getCliente(id, role);
  if (!cliente) notFound();

  const [vendas, todasParcelas, tenantConfig] = await Promise.all([
    listVendas(role, { clienteId: id }),
    listParcelas(),
    getTenantConfig(),
  ]);
  const parcelasDoCliente = todasParcelas.filter((p) => p.clienteChave === id);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">{cliente.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Cliente desde {formatDataBR(cliente.criado_em)}
        </p>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="dados">
            <TabsList>
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="historico">Histórico de compras</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="pt-4">
              <DadosTab cliente={cliente} mostrarCpf={role === "gestor"} />
            </TabsContent>

            <TabsContent value="historico" className="pt-4">
              {vendas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma compra registrada ainda.
                </p>
              ) : (
                <VendasTabela vendas={vendas} mostrarComissao={mostrarComissao} />
              )}
            </TabsContent>

            <TabsContent value="financeiro" className="pt-4">
              <ParcelasTable
                parcelas={parcelasDoCliente}
                multaPct={tenantConfig.multa_pct}
                moraPctDia={tenantConfig.mora_pct_dia}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
