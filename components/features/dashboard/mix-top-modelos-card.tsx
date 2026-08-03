import { Card, CardContent } from "@/components/ui/card";

export function MixTopModelosCard({
  mixCarroPct,
  mixMotoPct,
  topModelos,
}: {
  mixCarroPct: number;
  mixMotoPct: number;
  topModelos: { nome: string; qtd: number }[];
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 text-sm font-semibold">Mix carros × motos</div>
        <div className="mb-2 flex h-3 overflow-hidden rounded-full">
          <div className="bg-primary" style={{ width: `${mixCarroPct}%` }} />
          <div className="bg-warning" style={{ width: `${mixMotoPct}%` }} />
        </div>
        <div className="mb-4 flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-primary" />
            Carros {mixCarroPct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-sm bg-warning" />
            Motos {mixMotoPct}%
          </span>
        </div>

        <div className="mb-2 text-sm font-semibold">Top modelos</div>
        {topModelos.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
        ) : (
          topModelos.map((t) => (
            <div
              key={t.nome}
              className="flex justify-between border-t border-border py-1.5 text-sm first:border-t-0"
            >
              <span>{t.nome}</span>
              <span className="tabular-nums text-muted-foreground">{t.qtd} un.</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
