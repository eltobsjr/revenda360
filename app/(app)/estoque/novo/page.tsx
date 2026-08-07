import { getCurrentProfile } from "@/lib/auth/session";
import { listLojas } from "@/lib/data/equipe";
import { listFornecedoresOpcoes } from "@/lib/data/fornecedores";
import { VeiculoForm } from "@/components/features/estoque/entrada/veiculo-form";

export default async function NovoVeiculoPage() {
  const [profile, lojas, fornecedores] = await Promise.all([
    getCurrentProfile(),
    listLojas(),
    listFornecedoresOpcoes(),
  ]);
  const role = profile?.role ?? "vendedor";

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Entrada de veículo</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre um veículo novo no estoque.
        </p>
      </div>
      <VeiculoForm
        isGestor={role === "gestor"}
        lojas={lojas}
        fornecedores={fornecedores}
        tenantId={profile?.tenantId ?? ""}
      />
    </div>
  );
}
