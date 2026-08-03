import { RevendaForm } from "@/components/features/admin/revenda-form";

export default function NovaRevendaPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Nova revenda</h1>
        <p className="text-sm text-muted-foreground">
          Cria o tenant, a primeira loja e o gestor responsável.
        </p>
      </div>
      <RevendaForm />
    </div>
  );
}
