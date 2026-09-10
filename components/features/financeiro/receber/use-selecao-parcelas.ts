"use client";

import { useState } from "react";
import type { ParcelaRow } from "@/lib/data/contas-receber";
import { MAX_PARCELAS_POR_LOTE } from "@/lib/validation/baixa-parcela.schema";

/**
 * Seleção de parcelas para baixa em lote, compartilhada entre a tabela "Por
 * parcela" e o card de contrato.
 *
 * A seleção é derivada das linhas atuais a cada render, não guardada como
 * lista à parte: depois de uma baixa a parcela deixa de ser baixável e sai da
 * seleção sozinha, sem sobrar id fantasma inflando o contador.
 *
 * O teto de `MAX_PARCELAS_POR_LOTE` é aplicado aqui, e não só no servidor: a
 * server action rejeita o lote *inteiro* quando passa do limite, então um
 * "selecionar todas" numa carteira grande devolvia zero baixas e um erro que
 * só aparecia depois de abrir o modal e confirmar.
 */
export function useSelecaoParcelas(parcelas: ParcelaRow[]) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const baixaveis = parcelas.filter((p) => p.podeBaixar);
  const selecionadas = baixaveis.filter((p) => ids.has(p.id));
  const cabemNoLote = Math.min(baixaveis.length, MAX_PARCELAS_POR_LOTE);
  const todasSelecionadas = cabemNoLote > 0 && selecionadas.length === cabemNoLote;

  function alternarParcela(id: string, marcada: boolean) {
    setIds((atual) => {
      if (marcada && !atual.has(id) && atual.size >= MAX_PARCELAS_POR_LOTE) return atual;
      const proxima = new Set(atual);
      if (marcada) proxima.add(id);
      else proxima.delete(id);
      return proxima;
    });
  }

  /** Marca até o teto do lote — nunca mais do que o servidor aceita de uma vez. */
  function alternarTodas(marcar: boolean) {
    setIds(marcar ? new Set(baixaveis.slice(0, MAX_PARCELAS_POR_LOTE).map((p) => p.id)) : new Set());
  }

  return {
    baixaveis,
    selecionadas,
    todasSelecionadas,
    /** Estado visual de "algumas, mas não todas" para o checkbox de cabeçalho. */
    parcialmenteSelecionadas: selecionadas.length > 0 && !todasSelecionadas,
    estaSelecionada: (id: string) => ids.has(id),
    /** Quantas parcelas cabem num lote — o resto fica para a próxima leva. */
    limite: MAX_PARCELAS_POR_LOTE,
    /** Há mais parcelas baixáveis do que cabem num único lote. */
    excedeLimite: baixaveis.length > MAX_PARCELAS_POR_LOTE,
    alternarParcela,
    alternarTodas,
    limpar: () => setIds(new Set()),
  };
}
