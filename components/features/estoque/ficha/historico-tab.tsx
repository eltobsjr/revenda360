import { PackagePlus, Wrench } from "lucide-react";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";

export function HistoricoTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  const eventos = [
    {
      data: veiculo.data_entrada,
      icone: PackagePlus,
      texto: `Entrada em estoque — origem: ${veiculo.origem}`,
    },
    ...veiculo.custos.map((c) => ({
      data: c.data,
      icone: Wrench,
      texto: `${c.categoria} lançado — ${formatBRL(c.valor)}`,
    })),
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-2 text-xs text-muted-foreground">
        Histórico completo (propostas, reservas, alterações de preço) chega em uma fase futura —
        por ora, entrada em estoque e custos lançados.
      </p>
      <ol className="flex flex-col gap-3 border-l pl-4">
        {eventos.map((evento, i) => (
          <li key={i} className="relative">
            <evento.icone className="absolute -left-[22px] size-4 rounded-full bg-background text-muted-foreground" />
            <p className="text-sm">{evento.texto}</p>
            <p className="text-xs text-muted-foreground">{formatDataBR(evento.data)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
