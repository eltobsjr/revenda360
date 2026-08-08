import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getTrocaPendente } from "@/lib/data/avaliacao-troca";
import { listLojas } from "@/lib/data/equipe";
import { VeiculoForm } from "@/components/features/estoque/entrada/veiculo-form";
import { estadoInicialVeiculoForm } from "@/components/features/estoque/entrada/form-state";
import { formatBRL } from "@/lib/format";

export default async function CompletarTrocaPage({
  params,
}: {
  params: Promise<{ pagamentoId: string }>;
}) {
  const { pagamentoId } = await params;
  const [troca, profile, lojas] = await Promise.all([
    getTrocaPendente(pagamentoId),
    getCurrentProfile(),
    listLojas(),
  ]);
  if (!troca) notFound();

  const role = profile?.role ?? "vendedor";
  const estadoInicial = {
    ...estadoInicialVeiculoForm("carro"),
    origem: "Troca" as const,
    valorCompra: (troca.valor ?? 0).toString(),
    observacoes: `Recebido na troca: ${troca.descricao}`,
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Completar cadastro do veículo</h1>
        <p className="text-sm text-muted-foreground">
          Recebido na troca ({formatBRL(troca.valor)}) — venda de {troca.veiculoVendido} para{" "}
          {troca.cliente}. Confira/ajuste o tipo, complete a identificação e o restante dos dados
          antes de cadastrar no estoque.
        </p>
      </div>
      <VeiculoForm
        estadoInicial={estadoInicial}
        isGestor={role === "gestor"}
        lojas={lojas}
        tenantId={profile?.tenantId ?? ""}
        origemTrocaPagamentoId={troca.pagamentoId}
      />
    </div>
  );
}
