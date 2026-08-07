import type { EtapaLead } from "@/types/database.types";

export const ETAPAS_LEAD: EtapaLead[] = [
  "Novo",
  "Em contato",
  "Visita agendada",
  "Proposta enviada",
  "Ganho",
  "Perdido",
];

export type LeadRow = {
  id: string;
  nome: string;
  contato: string | null;
  origem: string | null;
  veiculoInteresse: string | null;
  vendedor: string | null;
  etapa: EtapaLead;
  observacoes: string | null;
  criadoEm: string;
};
