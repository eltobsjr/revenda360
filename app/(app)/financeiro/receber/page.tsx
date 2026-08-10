import { listParcelas, listContratos, listInadimplencia } from "@/lib/data/contas-receber";
import { getTenantConfig } from "@/lib/data/tenant";
import type { StatusParcela } from "@/lib/domain/juros";
import { ReceberModeTabs } from "@/components/features/financeiro/receber/receber-mode-tabs";
import { ParcelasTable } from "@/components/features/financeiro/receber/parcelas-table";
import { ContratosGrid } from "@/components/features/financeiro/receber/contratos-grid";
import { InadimplenciaTable } from "@/components/features/financeiro/receber/inadimplencia-table";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

const STATUS_FILTRAVEIS: StatusParcela[] = ["A vencer", "Paga", "Atrasada", "Parcial"];

export default async function ContasReceberPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; status?: string }>;
}) {
  const { mode, status } = await searchParams;
  const modoAtivo = mode === "parcela" || mode === "inadimplencia" ? mode : "contrato";
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

      {modoAtivo === "inadimplencia" ? (
        <InadimplenciaTable linhas={await listInadimplencia()} />
      ) : null}
    </div>
  );
}
