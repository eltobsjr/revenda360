import { getCurrentProfile } from "@/lib/auth/session";
import { listVeiculos } from "@/lib/data/veiculos";
import { listClientes } from "@/lib/data/clientes";
import { listMembrosEquipe } from "@/lib/data/equipe";
import { getTenantConfig } from "@/lib/data/tenant";
import { NovaVendaWizard } from "@/components/features/vendas/nova/nova-venda-wizard";

export default async function NovaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; veiculoId?: string; valorVenda?: string }>;
}) {
  const { clienteId, veiculoId, valorVenda } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const [veiculos, clientes, membros, tenantConfig] = await Promise.all([
    listVeiculos(role, { status: ["Disponível", "Consignado"] }),
    listClientes(role),
    listMembrosEquipe(),
    getTenantConfig(),
  ]);

  const vendedores = membros
    .filter((m) => m.ativo && (m.role === "vendedor" || m.role === "gestor"))
    .map((m) => ({ id: m.id, nome: m.nome }));

  const vendedorAtualId =
    profile && vendedores.some((v) => v.id === profile.id) ? profile.id : (vendedores[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Nova venda</h1>
        <p className="text-sm text-muted-foreground">
          Registre a venda de um veículo disponível no estoque.
        </p>
      </div>

      <NovaVendaWizard
        veiculos={veiculos}
        clientes={clientes}
        vendedores={vendedores}
        vendedorAtualId={vendedorAtualId}
        margemMinimaPctDefault={role === "gestor" ? tenantConfig.margem_minima_pct_default : 0}
        clienteIdInicial={clienteId}
        veiculoIdInicial={veiculoId}
        valorVendaInicial={valorVenda}
      />
    </div>
  );
}
