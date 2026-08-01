import { z } from "zod";

export const clienteFormSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  cpf: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  cidade: z.string().trim().optional(),
});

export type ClienteFormInput = z.infer<typeof clienteFormSchema>;
