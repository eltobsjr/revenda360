import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Pencil } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { getVeiculo } from "@/lib/data/veiculos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VeiculoStatusBadge } from "@/components/features/estoque/veiculo-status-badge";
import { ResumoTab } from "@/components/features/estoque/ficha/resumo-tab";
import { FinanceiroTab } from "@/components/features/estoque/ficha/financeiro-tab";
import { DocumentacaoTab } from "@/components/features/estoque/ficha/documentacao-tab";
import { HistoricoTab } from "@/components/features/estoque/ficha/historico-tab";
import { AnunciosTab } from "@/components/features/estoque/ficha/anuncios-tab";
import { formatBRL } from "@/lib/format";

export default async function FichaVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const veiculo = await getVeiculo(id, role);
  if (!veiculo) notFound();

  const mostrarFinanceiro = role === "gestor";
  const documentacaoPendente =
    veiculo.gravame ||
    !veiculo.crlv_em_dia ||
    veiculo.ipva_status !== "Pago" ||
    veiculo.multas_valor > 0;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            {veiculo.marca} {veiculo.modelo} {veiculo.versao}
          </h1>
          <p className="text-sm text-muted-foreground">
            {veiculo.placa} · {veiculo.ano_fab}/{veiculo.ano_mod} · {veiculo.cor}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VeiculoStatusBadge status={veiculo.status} />
          <span className="tabular-nums text-lg font-semibold">
            {formatBRL(veiculo.preco_venda)}
          </span>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/estoque/${veiculo.id}/editar`} />}
            nativeButton={false}
          >
            <Pencil />
            Editar
          </Button>
        </div>
      </div>

      {documentacaoPendente ? (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          Este veículo tem gravame ativo ou pendência de documentação — ver aba Documentação.
        </div>
      ) : null}

      <Card>
        <CardContent>
          <Tabs defaultValue="resumo">
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              {mostrarFinanceiro ? (
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              ) : null}
              <TabsTrigger value="documentacao">Documentação</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="anuncios">Anúncios</TabsTrigger>
            </TabsList>
            <TabsContent value="resumo" className="pt-4">
              <ResumoTab veiculo={veiculo} />
            </TabsContent>
            {mostrarFinanceiro ? (
              <TabsContent value="financeiro" className="pt-4">
                <FinanceiroTab veiculo={veiculo} />
              </TabsContent>
            ) : null}
            <TabsContent value="documentacao" className="pt-4">
              <DocumentacaoTab veiculo={veiculo} />
            </TabsContent>
            <TabsContent value="historico" className="pt-4">
              <HistoricoTab veiculo={veiculo} />
            </TabsContent>
            <TabsContent value="anuncios" className="pt-4">
              <AnunciosTab veiculo={veiculo} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
