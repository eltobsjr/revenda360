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
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";
  const [troca, lojas] = await Promise.all([getTrocaPendente(pagamentoId, role), listLojas()]);
  if (!troca) notFound();

  // troca.valor só vem preenchido pra role "gestor" (regra suprema do
  // CLAUDE.md: valor de compra é sempre sensível, sem exceção mesmo aqui,
  // onde antes vazava tanto no texto quanto no pré-preenchimento do campo).
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
          Recebido na troca
          {troca.valor !== null ? ` (${formatBRL(troca.valor)})` : ""} — venda de{" "}
          {troca.veiculoVendido} para {troca.cliente}. Confira/ajuste o tipo, complete a
          identificação e o restante dos dados antes de cadastrar no estoque.
          {troca.valor === null ? (
            <> O valor de compra precisa ser preenchido por um gestor.</>
          ) : null}
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
