import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { listContasPagar } from "@/lib/data/contas-pagar";
import { ContaPagarForm } from "@/components/features/financeiro/pagar/conta-pagar-form";
import { ContasPagarTable } from "@/components/features/financeiro/pagar/contas-pagar-table";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import type { StatusParcela } from "@/lib/domain/juros";

const STATUS_FILTRAVEIS: StatusParcela[] = ["A vencer", "Paga", "Atrasada"];

export default async function ContasPagarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  // Dado financeiro interno (o que a revenda deve) — só gestor e financeiro,
  // mesmo critério pedido pra esta fase (diferente de Contas a receber, que
  // hoje não restringe a tela por papel).
  if (role === "vendedor") redirect("/dashboard");

  const filtroStatus = STATUS_FILTRAVEIS.includes(status as StatusParcela)
    ? (status as StatusParcela)
    : undefined;

  const contas = await listContasPagar(role, filtroStatus);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Contas a pagar</h1>
          <p className="text-sm text-muted-foreground">
            {contas.length} conta{contas.length === 1 ? "" : "s"} no filtro atual.
          </p>
        </div>
        <ContaPagarForm />
      </div>

      <form className="flex items-end gap-3" action="/financeiro/pagar">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect name="status" defaultValue={filtroStatus ?? "todos"} className="w-48">
            <NativeSelectOption value="todos">Status: todos</NativeSelectOption>
            {STATUS_FILTRAVEIS.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <ContasPagarTable contas={contas} />
    </div>
  );
}
