import { z } from "zod";

// Subconjunto de `tipo_pagamento` (Fase 4) que faz sentido para a quitação
// de uma parcela — sem troca/financiamento/crediário, que são formas de
// composição de uma venda, não de baixa de parcela.
export const FORMAS_PAGAMENTO_BAIXA = ["dinheiro", "pix", "cartao", "transferencia"] as const;

export const baixaParcelaSchema = z.object({
  parcelaId: z.string().uuid("Parcela inválida."),
  desconto: z.number().min(0).default(0),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_BAIXA),
});

export type BaixaParcelaInput = z.infer<typeof baixaParcelaSchema>;
