"use client";

import { useState } from "react";
import type { ParcelaRow } from "@/lib/data/contas-receber";

/**
 * Seleção de parcelas para baixa em lote, compartilhada entre a tabela "Por
 * parcela" e o card de contrato.
 *
 * A seleção é derivada das linhas atuais a cada render, não guardada como
 * lista à parte: depois de uma baixa a parcela deixa de ser baixável e sai da
 * seleção sozinha, sem sobrar id fantasma inflando o contador.
 */
export function useSelecaoParcelas(parcelas: ParcelaRow[]) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const baixaveis = parcelas.filter((p) => p.podeBaixar);
  const selecionadas = baixaveis.filter((p) => ids.has(p.id));
  const todasSelecionadas = baixaveis.length > 0 && selecionadas.length === baixaveis.length;

  function alternarParcela(id: string, marcada: boolean) {
    setIds((atual) => {
      const proxima = new Set(atual);
      if (marcada) proxima.add(id);
      else proxima.delete(id);
      return proxima;
    });
  }

  function alternarTodas(marcar: boolean) {
    setIds(marcar ? new Set(baixaveis.map((p) => p.id)) : new Set());
  }

  return {
    baixaveis,
    selecionadas,
    todasSelecionadas,
    /** Estado visual de "algumas, mas não todas" para o checkbox de cabeçalho. */
    parcialmenteSelecionadas: selecionadas.length > 0 && !todasSelecionadas,
    estaSelecionada: (id: string) => ids.has(id),
    alternarParcela,
    alternarTodas,
    limpar: () => setIds(new Set()),
  };
}
