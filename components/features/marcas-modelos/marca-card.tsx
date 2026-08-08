import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { atualizarMarca, atualizarModelo } from "@/app/(app)/marcas-modelos/actions";
import { EditarCatalogoDialog } from "./editar-catalogo-dialog";
import { NovoModeloDialog } from "./novo-modelo-dialog";
import { StopSummaryToggle } from "./stop-summary-toggle";
import type { MarcaComModelos } from "@/lib/data/marcas-modelos";

export function MarcaCard({ marca }: { marca: MarcaComModelos }) {
  return (
    <Card>
      <CardContent className="p-0">
        <details className="group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
            <span className="flex items-center gap-2 font-medium">
              {marca.nome}
              {!marca.ativo ? (
                <Badge variant="outline" className="border-muted-foreground/20 bg-muted text-muted-foreground">
                  Inativa
                </Badge>
              ) : null}
              <span className="text-xs font-normal text-muted-foreground">
                {marca.modelos.length} modelo{marca.modelos.length === 1 ? "" : "s"}
              </span>
            </span>
            <StopSummaryToggle>
              <EditarCatalogoDialog
                titulo="Editar marca"
                idFieldName="marcaId"
                id={marca.id}
                nome={marca.nome}
                ativo={marca.ativo}
                action={atualizarMarca}
              />
              <NovoModeloDialog marcaId={marca.id} marcaNome={marca.nome} />
            </StopSummaryToggle>
          </summary>
          <div className="flex flex-col gap-2 border-t p-4">
            {marca.modelos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado ainda.</p>
            ) : (
              marca.modelos.map((mo) => (
                <div
                  key={mo.id}
                  className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-2">
                    {mo.nome}
                    {!mo.ativo ? (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground/20 bg-muted text-muted-foreground"
                      >
                        Inativo
                      </Badge>
                    ) : null}
                  </span>
                  <EditarCatalogoDialog
                    titulo={`Editar modelo (${marca.nome})`}
                    idFieldName="modeloId"
                    id={mo.id}
                    nome={mo.nome}
                    ativo={mo.ativo}
                    action={atualizarModelo}
                  />
                </div>
              ))
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
