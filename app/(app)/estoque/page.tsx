import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { listVeiculos, listMarcasDisponiveis } from "@/lib/data/veiculos";
import { getTenantConfig } from "@/lib/data/tenant";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstoqueFiltros } from "@/components/features/estoque/estoque-filtros";
import { VeiculoTabela } from "@/components/features/estoque/veiculo-tabela";
import { VeiculoCard } from "@/components/features/estoque/veiculo-card";
import type { TipoVeiculo, StatusVeiculo } from "@/types/database.types";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    tipo?: string;
    status?: string;
    marca?: string;
    visao?: string;
  }>;
}) {
  const params = await searchParams;
  const visao = params.visao === "galeria" ? "galeria" : "lista";

  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  const [veiculos, marcasDisponiveis, tenantConfig] = await Promise.all([
    listVeiculos(role, {
      busca: params.busca,
      tipo: params.tipo as TipoVeiculo | undefined,
      status: params.status as StatusVeiculo | undefined,
      marca: params.marca,
    }),
    listMarcasDisponiveis(),
    getTenantConfig(),
  ]);

  const mostrarFinanceiro = role === "gestor";
  const diasAlerta = tenantConfig.dias_alerta_estoque_parado;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Veículos</h1>
          <p className="text-sm text-muted-foreground">
            {veiculos.length} veículo{veiculos.length === 1 ? "" : "s"} no estoque
          </p>
        </div>
        <Link href="/estoque/novo" className={buttonVariants()}>
          <PackagePlus />
          Entrada de veículo
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EstoqueFiltros
              busca={params.busca}
              tipo={params.tipo}
              status={params.status}
              marca={params.marca}
              marcasDisponiveis={marcasDisponiveis}
              visao={visao}
            />
            <div className="flex gap-1 rounded-md border p-0.5">
              <Link
                href={{ query: { ...params, visao: "lista" } }}
                className={`rounded px-3 py-1 text-sm ${
                  visao === "lista" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Lista
              </Link>
              <Link
                href={{ query: { ...params, visao: "galeria" } }}
                className={`rounded px-3 py-1 text-sm ${
                  visao === "galeria" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Galeria
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {veiculos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Nenhum veículo encontrado</p>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros ou cadastre um veículo novo em Entrada de veículo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: alterna entre tabela densa e galeria conforme `visao`. */}
          <div className="hidden md:block">
            {visao === "lista" ? (
              <Card>
                <CardContent className="p-0">
                  <VeiculoTabela
                    veiculos={veiculos}
                    diasAlertaEstoqueParado={diasAlerta}
                    mostrarFinanceiro={mostrarFinanceiro}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {veiculos.map((v) => (
                  <VeiculoCard key={v.id} veiculo={v} diasAlertaEstoqueParado={diasAlerta} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile: sempre em cards, independente da visão escolhida. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {veiculos.map((v) => (
              <VeiculoCard key={v.id} veiculo={v} diasAlertaEstoqueParado={diasAlerta} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
