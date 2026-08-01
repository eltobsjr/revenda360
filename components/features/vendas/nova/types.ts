import type { VeiculoComFinanceiro } from "@/lib/data/veiculos";

export type ClienteOpcao = {
  id: string;
  nome: string;
  cpf: string | null;
  cidade: string | null;
};

export type VendedorOpcao = {
  id: string;
  nome: string;
};

export type VeiculoOpcao = VeiculoComFinanceiro;
