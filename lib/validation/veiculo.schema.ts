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

/**
 * Categorias de custo lançado — mesma lista usada em `custos_veiculo.categoria`
 * (constraint no banco em 0003_fase1_estoque.sql).
 */
export const CATEGORIAS_CUSTO = [
  "Mecânica",
  "Funilaria/pintura",
  "Pneus",
  "Documentação/transferência",
  "Higienização/estética",
  "Frete",
  "Comissão de captação",
  "Outros",
] as const;

export const custoLinhaSchema = z.object({
  categoria: z.enum(CATEGORIAS_CUSTO),
  descricao: z.string().optional(),
  fornecedor: z.string().optional(),
  valor: z.number().min(0),
  data: z.string().min(1),
});

export type CustoLinha = z.infer<typeof custoLinhaSchema>;

const PORTAIS_DISPONIVEIS = [
  "OLX",
  "Webmotors",
  "iCarros",
  "Mercado Livre",
  "Site próprio",
] as const;

export { PORTAIS_DISPONIVEIS };

/**
 * Campos completos do formulário de Entrada de veículo (comuns a carro e
 * moto). `especificacoes` é validado à parte por `parseEspecificacoes`
 * conforme o `tipo` escolhido — mantido fora deste schema porque é uma união
 * discriminada externamente (pelo campo `tipo` aqui, não um campo interno).
 */
export const veiculoFormSchema = z.object({
  tipo: z.enum(["carro", "moto"]),
  placa: z.string().min(7, "Placa incompleta"),
  renavam: z.string().optional(),
  chassi: z
    .string()
    .optional()
    .refine((v) => !v || v.length === 17, "Chassi deve ter 17 caracteres"),
  numeroMotor: z.string().optional(),
  ufEmplacamento: z.string().optional(),
  municipioEmplacamento: z.string().optional(),
  marca: z.string().min(1, "Informe a marca"),
  modelo: z.string().min(1, "Informe o modelo"),
  versao: z.string().optional(),
  anoFab: z.number().int().optional(),
  anoMod: z.number().int().optional(),
  cor: z.string().optional(),
  combustivel: z.string().optional(),
  km: z.number().min(0),
  procedencia: z.enum(["nacional", "importado"]).default("nacional"),
  categoria: z.enum(["particular", "aluguel"]).default("particular"),
  proprietariosAnteriores: z.number().int().min(0).default(0),

  crlvEmDia: z.boolean().default(true),
  ipvaStatus: z.enum(["Pago", "Pendente"]).default("Pago"),
  ipvaValor: z.number().optional(),
  ipvaAno: z.number().int().optional(),
  licenciamentoEmDia: z.boolean().default(true),
  multasValor: z.number().min(0).default(0),
  gravame: z.boolean().default(false),
  gravameFinanceira: z.string().optional(),
  gravameValorQuitacao: z.number().optional(),
  crvEmMaos: z.boolean().default(true),
  atpve: z.boolean().default(false),
  laudoCautelar: z.enum(["Aprovado", "Com apontamento", "Não feito"]).default("Não feito"),
  historicoLeilaoSinistro: z.boolean().default(false),
  chaveReserva: z.boolean().default(true),
  manualProprietario: z.boolean().default(true),

  dataEntrada: z.string().min(1),
  origem: z
    .enum(["Compra de particular", "Troca", "Leilão", "Repasse de outra loja", "Consignado"])
    .default("Compra de particular"),
  fornecedor: z.string().optional(),
  valorCompra: z.number().min(0),
  formaPagCompra: z.string().optional(),
  lojaId: z.string().optional(),

  valorFipe: z.number().optional(),
  precoVenda: z.number().min(0),
  precoFinanciamento: z.number().optional(),
  precoMinimo: z.number().optional(),

  descricaoAnuncio: z.string().optional(),
  portaisPublicar: z.array(z.string()).default([]),
  observacoes: z.string().optional(),

  custos: z.array(custoLinhaSchema).default([]),
});

export type VeiculoFormInput = z.infer<typeof veiculoFormSchema>;
