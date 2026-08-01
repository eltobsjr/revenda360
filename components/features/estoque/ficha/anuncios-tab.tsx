import { Badge } from "@/components/ui/badge";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";

export function AnunciosTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Portais publicados
        </p>
        {veiculo.portais_publicar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum portal marcado para publicação ainda.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {veiculo.portais_publicar.map((portal) => (
              <Badge key={portal} variant="secondary">
                {portal}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Publicação em portais é manual nesta fase — sem integração automática ainda.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Descrição do anúncio
        </p>
        <p className="text-sm whitespace-pre-wrap">
          {veiculo.descricao_anuncio || "Nenhuma descrição cadastrada."}
        </p>
      </div>
    </div>
  );
}
