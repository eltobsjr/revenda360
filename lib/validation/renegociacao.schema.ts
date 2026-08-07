import { z } from "zod";

const parcelaRenegociadaSchema = z.object({
  numero: z.number().int().positive(),
  vencimento: z.string().min(1),
  valor: z.number().positive(),
});

export const renegociarContratoSchema = z.object({
  contratoId: z.string().uuid(),
  qtdParcelas: z.number().int().positive(),
  taxaJurosMensal: z.number().min(0),
  dataPrimeiroVencimento: z.string().min(1),
  parcelas: z.array(parcelaRenegociadaSchema).min(1),
});

export type RenegociarContratoInput = z.infer<typeof renegociarContratoSchema>;
