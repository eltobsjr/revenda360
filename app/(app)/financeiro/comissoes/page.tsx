import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { listComissoesPorVendedor } from "@/lib/data/comissoes";
import { ComissoesLista } from "@/components/features/financeiro/comissoes/comissoes-lista";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

function mesAtualIso(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function ultimoDiaDoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${anoMes}-${String(ultimoDia).padStart(2, "0")}`;
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  // Dado de custo/remuneração interna — 100% gestor (nem financeiro vê).
  if (role !== "gestor") redirect("/dashboard");

  const mesFiltro = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : mesAtualIso();
  const dataInicial = `${mesFiltro}-01`;
  const dataFinal = ultimoDiaDoMes(mesFiltro);

  const comissoes = await listComissoesPorVendedor(dataInicial, dataFinal, role);
  const totalPago = comissoes.reduce((soma, c) => soma + c.totalPago, 0);
  const totalPendente = comissoes.reduce((soma, c) => soma + c.totalPendente, 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Comissões</h1>
        <p className="text-sm text-muted-foreground">Comissão por vendedor no período.</p>
      </div>

      <form className="flex items-end gap-3" action="/financeiro/comissoes">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mes" className="text-xs font-medium text-muted-foreground">
            Mês
          </label>
          <Input id="mes" name="mes" type="month" defaultValue={mesFiltro} className="w-40" />
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total pago no período</p>
            <p className="text-lg font-semibold text-success">{formatBRL(totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total pendente no período</p>
            <p className="text-lg font-semibold text-warning">{formatBRL(totalPendente)}</p>
          </CardContent>
        </Card>
      </div>

      <ComissoesLista comissoes={comissoes} />
    </div>
  );
}
