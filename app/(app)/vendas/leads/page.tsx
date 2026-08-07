import { getCurrentProfile } from "@/lib/auth/session";
import { listLeads } from "@/lib/data/leads";
import { listVeiculos } from "@/lib/data/veiculos";
import { NovoLeadDialog } from "@/components/features/leads/novo-lead-dialog";
import { LeadsBoard } from "@/components/features/leads/leads-board";

export default async function LeadsPage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const [leads, veiculos] = await Promise.all([
    listLeads(),
    listVeiculos(role, { status: ["Disponível", "Consignado"] }),
  ]);

  const opcoesVeiculos = veiculos.map((v) => ({ id: v.id, nome: `${v.marca} ${v.modelo}` }));

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Arraste o card entre as etapas conforme o andamento da negociação.
          </p>
        </div>
        <NovoLeadDialog veiculos={opcoesVeiculos} />
      </div>

      <LeadsBoard leadsIniciais={leads} />
    </div>
  );
}
