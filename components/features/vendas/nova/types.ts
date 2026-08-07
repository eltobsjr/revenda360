import type { VeiculoComFinanceiro } from "@/lib/data/veiculos";

export type ClienteOpcao = {
  id: string;
  nome: string;
  /** Ausente quando o papel do usuário não é gestor (CPF é dado sensível filtrado em `lib/data/clientes.ts`). */
  cpf?: string | null;
  cidade: string | null;
};

export type VendedorOpcao = {
  id: string;
  nome: string;
};

export type VeiculoOpcao = VeiculoComFinanceiro;
