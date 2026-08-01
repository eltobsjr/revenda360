import { Check, X, AlertTriangle } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";

type ItemStatus = "ok" | "alerta" | "pendente";

function Semaforo({ status, label }: { status: ItemStatus; label: string }) {
  const Icone = status === "ok" ? Check : status === "alerta" ? AlertTriangle : X;
  const cor =
    status === "ok" ? "text-success" : status === "alerta" ? "text-warning" : "text-destructive";

  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <Icone className={`size-4 shrink-0 ${cor}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function DocumentacaoTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  const itens: { status: ItemStatus; label: string }[] = [
    { status: veiculo.crlv_em_dia ? "ok" : "pendente", label: "CRLV em dia" },
    {
      status: veiculo.ipva_status === "Pago" ? "ok" : "pendente",
      label: `IPVA ${veiculo.ipva_status.toLowerCase()}${
        veiculo.ipva_valor ? ` — ${formatBRL(veiculo.ipva_valor)}` : ""
      }`,
    },
    { status: veiculo.licenciamento_em_dia ? "ok" : "pendente", label: "Licenciamento em dia" },
    {
      status: veiculo.multas_valor > 0 ? "alerta" : "ok",
      label:
        veiculo.multas_valor > 0
          ? `Multas em aberto — ${formatBRL(veiculo.multas_valor)}`
          : "Sem multas em aberto",
    },
    {
      status: veiculo.gravame ? "alerta" : "ok",
      label: veiculo.gravame
        ? `Gravame ativo${veiculo.gravame_financeira ? ` (${veiculo.gravame_financeira})` : ""}`
        : "Sem gravame/alienação",
    },
    { status: veiculo.crv_em_maos ? "ok" : "pendente", label: "CRV/DUT em mãos" },
    { status: veiculo.atpve ? "ok" : "pendente", label: "ATPV-e" },
    {
      status:
        veiculo.laudo_cautelar === "Aprovado"
          ? "ok"
          : veiculo.laudo_cautelar === "Com apontamento"
            ? "alerta"
            : "pendente",
      label: `Laudo cautelar: ${veiculo.laudo_cautelar}`,
    },
    {
      status: veiculo.historico_leilao_sinistro ? "alerta" : "ok",
      label: veiculo.historico_leilao_sinistro
        ? "Histórico de leilão/sinistro"
        : "Sem histórico de leilão/sinistro",
    },
    { status: veiculo.chave_reserva ? "ok" : "pendente", label: "Chave reserva" },
    { status: veiculo.manual_proprietario ? "ok" : "pendente", label: "Manual do proprietário" },
  ];

  const pendenciasCriticas = itens.filter((i) => i.status !== "ok");

  return (
    <div className="flex flex-col gap-4">
      {pendenciasCriticas.length > 0 ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          {pendenciasCriticas.length} pendência{pendenciasCriticas.length === 1 ? "" : "s"} de
          documentação encontrada{pendenciasCriticas.length === 1 ? "" : "s"}.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {itens.map((item) => (
          <Semaforo key={item.label} status={item.status} label={item.label} />
        ))}
      </div>
    </div>
  );
}
