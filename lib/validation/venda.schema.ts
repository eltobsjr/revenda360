import { z } from "zod";

export const TIPOS_PAGAMENTO = [
  "dinheiro",
  "pix",
  "cartao",
  "transferencia",
  "troca",
  "financiamento_bancario",
  "crediario",
] as const;

export const pagamentoSchema = z.object({
  tipo: z.enum(TIPOS_PAGAMENTO),
  valor: z.number().positive("Valor do pagamento deve ser maior que zero."),
  detalhes: z.record(z.string(), z.unknown()).optional(),
});

export const parcelaGeradaSchema = z.object({
  numero: z.number().int().positive(),
  vencimento: z.string(),
  valor: z.number().positive(),
});

export const crediarioSchema = z.object({
  taxaJurosMensal: z.number().min(0),
  dataPrimeiroVencimento: z.string().min(1),
  parcelas: z.array(parcelaGeradaSchema).min(1, "Gere as parcelas antes de continuar."),
});

export const fecharVendaSchema = z.object({
  veiculoId: z.string().uuid("Selecione um veículo."),
  clienteId: z.string().uuid().optional(),
  clienteNomeAvulso: z.string().trim().optional(),
  vendedorId: z.string().uuid("Selecione o vendedor."),
  valorVenda: z.number().positive("Informe o valor de venda."),
  desconto: z.number().min(0).default(0),
  comissaoPct: z.number().min(0).max(100).default(0),
  garantia: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
  pagamentos: z.array(pagamentoSchema).min(1, "Informe ao menos uma forma de pagamento."),
  crediario: crediarioSchema.optional(),
});

export type FecharVendaInput = z.infer<typeof fecharVendaSchema>;
