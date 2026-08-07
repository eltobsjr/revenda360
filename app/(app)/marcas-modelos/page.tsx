import { listMarcasComModelos } from "@/lib/data/marcas-modelos";
import { NovaMarcaDialog } from "@/components/features/marcas-modelos/nova-marca-dialog";
import { MarcaCard } from "@/components/features/marcas-modelos/marca-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function MarcasModelosPage() {
  const marcas = await listMarcasComModelos();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Marcas / Modelos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo estruturado pra padronizar marca e modelo na Entrada de veículo. Veículos já
            cadastrados continuam mostrando o texto livre normalmente.
          </p>
        </div>
        <NovaMarcaDialog />
      </div>

      {marcas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhuma marca cadastrada</p>
            <p className="text-sm text-muted-foreground">
              Cadastre uma pra começar a padronizar o cadastro de veículos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {marcas.map((m) => (
            <MarcaCard key={m.id} marca={m} />
          ))}
        </div>
      )}
    </div>
  );
}
