import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  resumoEstoquePorStatus,
  resumoParcelasPorStatus,
  resumoContasPagar,
} from "@/lib/data/relatorios";
import { listParcelas } from "@/lib/data/contas-receber";
import { listContasPagar } from "@/lib/data/contas-pagar";
import { formatBRL, formatInt } from "@/lib/format";
import { RelatoriosTabs } from "@/components/features/relatorios/relatorios-tabs";
import { BaixarPdfVendasButton } from "@/components/features/relatorios/baixar-pdf-vendas-button";
import { KpiCard } from "@/components/features/dashboard/kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { Kpi } from "@/lib/data/dashboard";

type Aba = "estoque" | "vendas" | "pagar";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba: abaParam } = await searchParams;
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "vendedor";

  // Relatórios expõe dado financeiro agregado (estoque, crediário, contas a
  // pagar) — só gestor e financeiro têm acesso, vendedor nem chega na tela.
  if (role !== "gestor" && role !== "financeiro") redirect("/dashboard");

  const aba: Aba = abaParam === "vendas" || abaParam === "pagar" ? abaParam : "estoque";

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Resumo do estado atual do estoque, das vendas a crediário e das contas a pagar.
        </p>
      </div>

      <RelatoriosTabs abaAtiva={aba} />

      {aba === "estoque" ? <AbaEstoque role={role} /> : null}
      {aba === "vendas" ? <AbaVendas role={role} /> : null}
      {aba === "pagar" ? <AbaPagar role={role} /> : null}
    </div>
  );
}

async function AbaEstoque({ role }: { role: "gestor" | "vendedor" | "financeiro" }) {
  const resumo = await resumoEstoquePorStatus(role);
  const temFinanceiro = resumo.custoTotalAtivos !== undefined;

  const kpis: Kpi[] = [
    { label: "Veículos ativos", value: formatInt(resumo.qtdAtivos), sub: null, tone: "default" },
    {
      label: "Valor de venda potencial",
      value: formatBRL(resumo.valorVendaAtivos),
      sub: null,
      tone: "default",
    },
  ];
  if (temFinanceiro) {
    kpis.push(
      { label: "Valor investido", value: formatBRL(resumo.custoTotalAtivos), sub: null, tone: "default" },
      {
        label: "Margem potencial",
        value: formatBRL(resumo.margemAtivos),
        sub: null,
        tone: (resumo.margemAtivos ?? 0) >= 0 ? "success" : "destructive",
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {resumo.linhas.length === 0 ? (
        <EstadoVazio texto="Nenhum veículo cadastrado." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor de venda</TableHead>
                  {temFinanceiro ? (
                    <>
                      <TableHead className="text-right">Custo total</TableHead>
                      <TableHead className="text-right">Margem potencial</TableHead>
                    </>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumo.linhas.map((l) => (
                  <TableRow key={l.status}>
                    <TableCell className="font-medium">{l.status}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatInt(l.qtd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(l.valorVenda)}</TableCell>
                    {temFinanceiro ? (
                      <>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatBRL(l.custoTotal)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatBRL(l.margem)}</TableCell>
                      </>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <LinkDetalhado href="/estoque" texto="Ver detalhado em Estoque" />
    </div>
  );
}

const TONE_POR_STATUS: Record<string, Kpi["tone"]> = {
  Paga: "success",
  "A vencer": "default",
  Atrasada: "destructive",
  Parcial: "warning",
  Renegociada: "default",
};

async function AbaVendas({ role }: { role: "gestor" | "vendedor" | "financeiro" }) {
  const [linhas, parcelas, contasPagar] = await Promise.all([
    resumoParcelasPorStatus(),
    listParcelas(),
    listContasPagar(role),
  ]);
  const kpis: Kpi[] = linhas
    .filter((l) => l.status !== "Renegociada")
    .map((l) => ({
      label: l.status,
      value: formatBRL(l.valor),
      sub: `${formatInt(l.qtd)} parcela(s)`,
      tone: TONE_POR_STATUS[l.status] ?? "default",
    }));

  return (
    <div className="flex flex-col gap-4">
      {kpis.length === 0 ? (
        <EstadoVazio texto="Nenhuma venda a crediário registrada." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor total</TableHead>
                    <TableHead className="text-right">Valor pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.status}>
                      <TableCell className="font-medium">{l.status}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatInt(l.qtd)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(l.valor)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatBRL(l.valorPago)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <LinkDetalhado href="/financeiro/receber" texto="Ver detalhado em Contas a receber" />
        <BaixarPdfVendasButton parcelas={parcelas} contasPagar={contasPagar} />
      </div>
    </div>
  );
}

async function AbaPagar({ role }: { role: "gestor" | "vendedor" | "financeiro" }) {
  const resumo = await resumoContasPagar(role);

  const kpis: Kpi[] = resumo.porStatus
    .filter((l) => l.status !== "Renegociada" && l.status !== "Parcial")
    .map((l) => ({
      label: l.status,
      value: formatBRL(l.valor),
      sub: `${formatInt(l.qtd)} conta(s)`,
      tone: TONE_POR_STATUS[l.status] ?? "default",
    }));

  return (
    <div className="flex flex-col gap-4">
      {resumo.porCategoria.length === 0 ? (
        <EstadoVazio texto="Nenhuma conta a pagar registrada." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor total</TableHead>
                    <TableHead className="text-right">Valor pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumo.porCategoria.map((l) => (
                    <TableRow key={l.categoria}>
                      <TableCell className="font-medium">{l.categoria}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatInt(l.qtd)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(l.valor)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatBRL(l.valorPago)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <LinkDetalhado href="/financeiro/pagar" texto="Ver detalhado em Contas a pagar" />
    </div>
  );
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">{texto}</p>
      </CardContent>
    </Card>
  );
}

function LinkDetalhado({ href, texto }: { href: string; texto: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-primary hover:underline">
      {texto} →
    </Link>
  );
}
