"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContratoCard } from "./contrato-card";
import { casaBusca, dentroDoVencimento } from "@/lib/domain/filtros-receber";
import {
  FiltrosReceber,
  CRITERIOS_VAZIOS,
  type CriteriosReceber,
} from "./filtros-receber";
import type { ContratoRow, ParcelaRow } from "@/lib/data/contas-receber";

const SITUACOES = ["Com atraso", "Em dia", "Quitado"];

/** Situação de um contrato a partir do seu carnê — mesma leitura do card. */
function situacaoContrato(contrato: ContratoRow, parcelas: ParcelaRow[]): string {
  if (parcelas.some((p) => p.status === "Atrasada")) return "Com atraso";
  return contrato.saldo <= 0 ? "Quitado" : "Em dia";
}

export function ContratosGrid({
  contratos,
  parcelas,
  multaPct,
  moraPctDia,
  podeDarBaixa,
}: {
  contratos: ContratoRow[];
  parcelas: ParcelaRow[];
  multaPct: number;
  moraPctDia: number;
  podeDarBaixa: boolean;
}) {
  const [criterios, setCriterios] = useState<CriteriosReceber>(CRITERIOS_VAZIOS);

  // Carnê completo por contrato — pagas incluídas. O card precisa mostrar as
  // 24 parcelas, não só as em aberto: quem cobra precisa ver o que já foi
  // pago tanto quanto o que falta.
  const parcelasPorContrato = new Map<string, ParcelaRow[]>();
  for (const p of parcelas) {
    const lista = parcelasPorContrato.get(p.contratoId) ?? [];
    lista.push(p);
    parcelasPorContrato.set(p.contratoId, lista);
  }
  for (const lista of parcelasPorContrato.values()) {
    lista.sort((a, b) => a.numero - b.numero);
  }

  const hoje = new Date();

  const visiveis = contratos.filter((ct) => {
    const doContrato = parcelasPorContrato.get(ct.id) ?? [];
    if (!casaBusca(criterios.busca, [ct.cliente, ct.veiculo])) return false;
    if (criterios.situacao !== "todos" && situacaoContrato(ct, doContrato) !== criterios.situacao) {
      return false;
    }
    if (criterios.vencimento !== "todos") {
      // O eixo aqui é o contrato: ele entra se o próximo vencimento em aberto
      // cair na janela escolhida.
      if (!ct.proximoVencimento) return false;
      if (!dentroDoVencimento(ct.proximoVencimento, criterios.vencimento, hoje)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <FiltrosReceber
        criterios={criterios}
        onChange={setCriterios}
        situacoes={SITUACOES}
        rotuloSituacao="Situação"
        comVencimento
        totalFiltrado={visiveis.length}
        total={contratos.length}
        unidade="contrato"
      />

      {visiveis.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {contratos.length === 0
              ? "Nenhum contrato de crediário encontrado."
              : "Nenhum contrato para os filtros escolhidos."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((ct) => (
        <ContratoCard
          key={ct.id}
          contrato={ct}
              parcelas={parcelasPorContrato.get(ct.id) ?? []}
              multaPct={multaPct}
              moraPctDia={moraPctDia}
              podeDarBaixa={podeDarBaixa}
            />
          ))}
        </div>
      )}
    </div>
  );
}
