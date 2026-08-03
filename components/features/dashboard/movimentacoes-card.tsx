import { ShoppingCart, PackagePlus, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { Movimentacao } from "@/lib/data/dashboard";

const TIPO_ICON: Record<Movimentacao["tipo"], typeof ShoppingCart> = {
  venda: ShoppingCart,
  entrada: PackagePlus,
  recebimento: Wallet,
};

const TIPO_CLASSES: Record<Movimentacao["tipo"], string> = {
  venda: "bg-success/10 text-success",
  entrada: "bg-info/10 text-info",
  recebimento: "bg-warning/10 text-warning",
};

const TIPO_VALOR_CLASSES: Record<Movimentacao["tipo"], string> = {
  venda: "text-success",
  entrada: "text-destructive",
  recebimento: "text-success",
};

export function MovimentacoesCard({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 text-sm font-semibold">Últimas movimentações</div>
        {movimentacoes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          movimentacoes.map((m, i) => {
            const Icon = TIPO_ICON[m.tipo];
            return (
              <div
                key={i}
                className="flex items-center gap-3 border-t border-border py-2 first:border-t-0"
              >
                <div
                  className={cn(
                    "flex size-6.5 shrink-0 items-center justify-center rounded-full",
                    TIPO_CLASSES[m.tipo],
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 text-sm">{m.texto}</div>
                <div className={cn("whitespace-nowrap text-sm font-semibold tabular-nums", TIPO_VALOR_CLASSES[m.tipo])}>
                  {m.valor < 0 ? "-" : "+"}
                  {formatBRL(Math.abs(m.valor))}
                </div>
                <div className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDataBR(m.data)}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
