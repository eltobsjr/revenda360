import { listParcelas, listContratos, listSituacaoClientes } from "@/lib/data/contas-receber";
import { getTenantConfig } from "@/lib/data/tenant";
import type { StatusParcela } from "@/lib/domain/juros";
import { ReceberModeTabs } from "@/components/features/financeiro/receber/receber-mode-tabs";
import { ParcelasTable } from "@/components/features/financeiro/receber/parcelas-table";
import { ContratosGrid } from "@/components/features/financeiro/receber/contratos-grid";
import { SituacaoClientesTable } from "@/components/features/financeiro/receber/situacao-clientes-table";
import { BaixarPdfSituacaoClientesButton } from "@/components/features/financeiro/receber/baixar-pdf-situacao-clientes-button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

const STATUS_FILTRAVEIS: StatusParcela[] = ["A vencer", "Paga", "Atrasada", "Parcial"];

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; status?: string }>;
}) {
  const { mode, status } = await searchParams;
  // Padrão é "Por parcela": é a única visão com seleção múltipla e baixa em
  // lote, o caminho mais rápido do dia a dia. As outras continuam a um clique.
  const modoAtivo = mode === "contrato" || mode === "inadimplencia" ? mode : "parcela";
  const filtroStatus = STATUS_FILTRAVEIS.includes(status as StatusParcela)
    ? (status as StatusParcela)
    : undefined;

  const tenantConfig = await getTenantConfig();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-xl font-semibold">Contas a receber</h1>
        <ReceberModeTabs modoAtivo={modoAtivo} />
      </div>

      {modoAtivo === "parcela" ? (
        <>
          <form className="flex items-end gap-3" action="/financeiro/receber">
            <input type="hidden" name="mode" value="parcela" />
            <NativeSelect name="status" defaultValue={filtroStatus ?? "todos"} className="w-48">
              <NativeSelectOption value="todos">Status: todos</NativeSelectOption>
              {STATUS_FILTRAVEIS.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {s}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button type="submit" variant="outline">
              Filtrar
            </Button>
          </form>
          <ParcelasTable
            parcelas={await listParcelas(filtroStatus)}
            multaPct={tenantConfig.multa_pct}
            moraPctDia={tenantConfig.mora_pct_dia}
          />
        </>
      ) : null}

      {modoAtivo === "contrato" ? (
        <ContratosGrid
          contratos={await listContratos()}
          parcelas={await listParcelas()}
          multaPct={tenantConfig.multa_pct}
          moraPctDia={tenantConfig.mora_pct_dia}
        />
      ) : null}

      {modoAtivo === "inadimplencia" ? <SituacaoClientes /> : null}
    </div>
  );
}

async function SituacaoClientes() {
  const clientes = await listSituacaoClientes();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <BaixarPdfSituacaoClientesButton clientes={clientes} />
      </div>
      <SituacaoClientesTable linhas={clientes} />
    </div>
  );
}
