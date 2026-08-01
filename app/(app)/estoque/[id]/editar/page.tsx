import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getVeiculo } from "@/lib/data/veiculos";
import { listLojas } from "@/lib/data/equipe";
import { VeiculoForm } from "@/components/features/estoque/entrada/veiculo-form";
import { veiculoParaFormState } from "@/components/features/estoque/entrada/form-state";

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const [veiculo, lojas] = await Promise.all([getVeiculo(id, role), listLojas()]);
  if (!veiculo) notFound();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          Editar {veiculo.marca} {veiculo.modelo}
        </h1>
        <p className="text-sm text-muted-foreground">{veiculo.placa}</p>
      </div>
      <VeiculoForm
        estadoInicial={veiculoParaFormState(veiculo)}
        veiculoId={veiculo.id}
        isGestor={role === "gestor"}
        lojas={lojas}
        tenantId={profile?.tenantId ?? ""}
        fotosExistentes={veiculo.fotos}
      />
    </div>
  );
}
