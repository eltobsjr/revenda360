import { z } from "zod";

/**
 * Campos exclusivos de carro/moto, guardados em `veiculos.especificacoes`
 * (jsonb) — evita dezenas de colunas nullable no banco. O discriminador é o
 * campo `tipo` da própria linha de `veiculos`, não um campo redundante aqui
 * dentro; por isso `parseEspecificacoes` recebe o tipo separadamente.
 */

export const OPCIONAIS_CARRO = [
  "Ar-condicionado",
  "Direção hidráulica/elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Airbag",
  "ABS",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Multimídia/CarPlay",
  "Bancos de couro",
  "Teto solar",
  "Rodas de liga",
  "Faróis de LED",
  "Piloto automático",
  "Engate",
  "Kit GNV",
  "Controle de estabilidade",
] as const;

export const ACESSORIOS_MOTO = [
  "Baú",
  "Protetor de motor/carenagem",
  "Alarme",
  "Bolha",
  "Capacete incluso",
  "Escapamento esportivo",
  "Manopla aquecida",
  "Rastreador",
] as const;

export const especificacoesCarroSchema = z.object({
  cambio: z.enum(["Manual", "Automático", "CVT", "Automatizado", "Dupla embreagem"]),
  motorizacao: z.string().optional(),
  potenciaCv: z.number().optional(),
  portas: z.number().int().optional(),
  carroceria: z.enum([
    "Hatch",
    "Sedã",
    "SUV",
    "Picape",
    "Minivan",
    "Station wagon",
  ]),
  tracao: z.enum(["Dianteira", "Traseira", "4x4/AWD"]).optional(),
  blindado: z.boolean().default(false),
  blindadoNivel: z.string().optional(),
  finalPlaca: z.string().optional(),
  opcionais: z.array(z.enum(OPCIONAIS_CARRO)).default([]),
});

export const especificacoesMotoSchema = z.object({
  cilindradaCc: z.number().optional(),
  tipo: z.enum([
    "Street",
    "Naked",
    "Trail/Big trail",
    "Scooter",
    "Custom",
    "Esportiva",
    "Cub/Mobilete",
    "Off-road",
    "Triciclo",
  ]),
  marchas: z.number().int().optional(),
  partida: z.enum(["Elétrica", "Pedal", "Ambas"]).optional(),
  refrigeracao: z.enum(["Ar", "Líquida"]).optional(),
  alimentacao: z.enum(["Injeção", "Carburador"]).optional(),
  freioDianteiro: z.enum(["Disco", "Tambor"]).optional(),
  freioTraseiro: z.enum(["Disco", "Tambor"]).optional(),
  sistemaFreio: z.enum(["ABS", "CBS", "Convencional"]).optional(),
  tipoRoda: z.enum(["Raio", "Liga leve"]).optional(),
  acessorios: z.array(z.enum(ACESSORIOS_MOTO)).default([]),
});

export type EspecificacoesCarro = z.infer<typeof especificacoesCarroSchema>;
export type EspecificacoesMoto = z.infer<typeof especificacoesMotoSchema>;

export function parseEspecificacoes(
  tipo: "carro" | "moto",
  raw: unknown,
): EspecificacoesCarro | EspecificacoesMoto {
  const schema = tipo === "carro" ? especificacoesCarroSchema : especificacoesMotoSchema;
  return schema.parse(raw ?? {});
}
