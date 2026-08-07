import { z } from "zod";

export const contaPagarFormSchema = z.object({
  descricao: z.string().trim().min(1, "Informe a descrição."),
  categoria: z.string().trim().optional(),
  fornecedor: z.string().trim().optional(),
  valor: z.number().positive("Informe um valor maior que zero."),
  vencimento: z.string().min(1, "Informe o vencimento."),
});

export type ContaPagarFormInput = z.infer<typeof contaPagarFormSchema>;

// Mesmo subconjunto de `tipo_pagamento` já usado na baixa de parcela (Fase
// 5) — sem troca/financiamento/crediário, que não fazem sentido pra quitar
// uma conta.
export const FORMAS_PAGAMENTO_BAIXA_CONTA = ["dinheiro", "pix", "cartao", "transferencia"] as const;

export const baixaContaPagarSchema = z.object({
  contaPagarId: z.string().uuid("Conta inválida."),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_BAIXA_CONTA),
});

export type BaixaContaPagarInput = z.infer<typeof baixaContaPagarSchema>;
