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

/**
 * Teto de parcelas por lote. Não é limitação de banco: é o que impede um
 * "selecionar todas" numa carteira grande de virar centenas de UPDATEs numa
 * única server action, estourando o tempo de resposta. Acima disso o usuário
 * filtra (por status) e baixa em levas.
 */
export const MAX_PARCELAS_POR_LOTE = 100;

export const baixaLoteSchema = z.object({
  parcelaIds: z
    .array(z.string().uuid("Parcela inválida."))
    .min(1, "Selecione ao menos uma parcela.")
    .max(MAX_PARCELAS_POR_LOTE, `Selecione no máximo ${MAX_PARCELAS_POR_LOTE} parcelas por vez.`),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_BAIXA),
});

export type BaixaLoteInput = z.infer<typeof baixaLoteSchema>;
