import Link from "next/link";
import { listTrocasPendentes } from "@/lib/data/avaliacao-troca";
import { getCurrentProfile } from "@/lib/auth/session";
import { formatBRL, formatDataBR } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function AvaliacaoTrocaPage() {
  const profile = await getCurrentProfile();
  const pendentes = await listTrocasPendentes(profile?.role ?? "vendedor");

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Avaliação / Troca</h1>
        <p className="text-sm text-muted-foreground">
          Veículos recebidos na troca em vendas fechadas, aguardando completar o cadastro no
          estoque.
        </p>
      </div>

      {pendentes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhuma troca pendente</p>
            <p className="text-sm text-muted-foreground">
              Toda troca registrada em Nova venda já foi cadastrada no estoque.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendentes.map((p) => (
            <Card key={p.pagamentoId}>
              <CardContent className="flex flex-col gap-2">
                <p className="font-medium">{p.descricao}</p>
                <p className="text-sm text-muted-foreground">
                  Recebido na venda de {p.veiculoVendido} para {p.cliente} —{" "}
                  {formatDataBR(p.dataVenda)}
                </p>
                {p.valor !== null ? (
                  <p className="text-lg font-semibold tabular-nums">{formatBRL(p.valor)}</p>
                ) : null}
                <Link
                  href={`/estoque/avaliacao-troca/${p.pagamentoId}`}
                  className={buttonVariants({ size: "sm", className: "mt-2 self-start" })}
                >
                  Completar cadastro
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
