import { dataIsoLocal } from "@/lib/domain/datas";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";
import type { CustoLinha } from "@/lib/validation/veiculo.schema";

/**
 * Estado local do formulário — valores numéricos ficam como string (mesma
 * semântica de um input controlado), convertidos para number só na hora de
 * calcular a margem ao vivo ou de montar o payload de envio.
 */
export type VeiculoFormState = {
  tipo: "carro" | "moto";
  placa: string;
  renavam: string;
  chassi: string;
  numeroMotor: string;
  ufEmplacamento: string;
  municipioEmplacamento: string;
  marca: string;
  modelo: string;
  versao: string;
  anoFab: string;
  anoMod: string;
  cor: string;
  combustivel: string;
  km: string;
  procedencia: "nacional" | "importado";
  categoria: "particular" | "aluguel";
  proprietariosAnteriores: string;

  crlvEmDia: boolean;
  ipvaStatus: "Pago" | "Pendente";
  ipvaValor: string;
  ipvaAno: string;
  licenciamentoEmDia: boolean;
  multasValor: string;
  gravame: boolean;
  gravameFinanceira: string;
  gravameValorQuitacao: string;
  crvEmMaos: boolean;
  atpve: boolean;
  laudoCautelar: "Aprovado" | "Com apontamento" | "Não feito";
  historicoLeilaoSinistro: boolean;
  chaveReserva: boolean;
  manualProprietario: boolean;

  dataEntrada: string;
  origem:
    | "Compra de particular"
    | "Troca"
    | "Leilão"
    | "Repasse de outra loja"
    | "Consignado";
  fornecedor: string;
  valorCompra: string;
  formaPagCompra: string;
  lojaId: string;

  valorFipe: string;
  precoVenda: string;
  precoFinanciamento: string;
  precoMinimo: string;

  descricaoAnuncio: string;
  portaisPublicar: string[];
  observacoes: string;

  custos: (Omit<CustoLinha, "valor"> & { valor: string })[];

  especCarro: {
    cambio: "Manual" | "Automático" | "CVT" | "Automatizado" | "Dupla embreagem";
    motorizacao: string;
    potenciaCv: string;
    portas: string;
    carroceria: "Hatch" | "Sedã" | "SUV" | "Picape" | "Minivan" | "Station wagon";
    tracao: "" | "Dianteira" | "Traseira" | "4x4/AWD";
    blindado: boolean;
    blindadoNivel: string;
    finalPlaca: string;
    opcionais: string[];
  };

  especMoto: {
    cilindradaCc: string;
    tipo:
      | "Street"
      | "Naked"
      | "Trail/Big trail"
      | "Scooter"
      | "Custom"
      | "Esportiva"
      | "Cub/Mobilete"
      | "Off-road"
      | "Triciclo";
    marchas: string;
    partida: "" | "Elétrica" | "Pedal" | "Ambas";
    refrigeracao: "" | "Ar" | "Líquida";
    alimentacao: "" | "Injeção" | "Carburador";
    freioDianteiro: "" | "Disco" | "Tambor";
    freioTraseiro: "" | "Disco" | "Tambor";
    sistemaFreio: "" | "ABS" | "CBS" | "Convencional";
    tipoRoda: "" | "Raio" | "Liga leve";
    acessorios: string[];
  };
};

export function estadoInicialVeiculoForm(tipo: "carro" | "moto"): VeiculoFormState {
  const hoje = dataIsoLocal(new Date());
  return {
    tipo,
    placa: "",
    renavam: "",
    chassi: "",
    numeroMotor: "",
    ufEmplacamento: "",
    municipioEmplacamento: "",
    marca: "",
    modelo: "",
    versao: "",
    anoFab: "",
    anoMod: "",
    cor: "",
    combustivel: "",
    km: "",
    procedencia: "nacional",
    categoria: "particular",
    proprietariosAnteriores: "0",

    crlvEmDia: true,
    ipvaStatus: "Pago",
    ipvaValor: "",
    ipvaAno: "",
    licenciamentoEmDia: true,
    multasValor: "0",
    gravame: false,
    gravameFinanceira: "",
    gravameValorQuitacao: "",
    crvEmMaos: true,
    atpve: false,
    laudoCautelar: "Não feito",
    historicoLeilaoSinistro: false,
    chaveReserva: true,
    manualProprietario: true,

    dataEntrada: hoje,
    origem: "Compra de particular",
    fornecedor: "",
    valorCompra: "",
    formaPagCompra: "",
    lojaId: "",

    valorFipe: "",
    precoVenda: "",
    precoFinanciamento: "",
    precoMinimo: "",

    descricaoAnuncio: "",
    portaisPublicar: [],
    observacoes: "",

    custos: [],

    especCarro: {
      cambio: "Manual",
      motorizacao: "",
      potenciaCv: "",
      portas: "4",
      carroceria: "Hatch",
      tracao: "",
      blindado: false,
      blindadoNivel: "",
      finalPlaca: "",
      opcionais: [],
    },
    especMoto: {
      cilindradaCc: "",
      tipo: "Street",
      marchas: "",
      partida: "",
      refrigeracao: "",
      alimentacao: "",
      freioDianteiro: "",
      freioTraseiro: "",
      sistemaFreio: "",
      tipoRoda: "",
      acessorios: [],
    },
  };
}

export function veiculoParaFormState(v: VeiculoDetalhe): VeiculoFormState {
  const base = estadoInicialVeiculoForm(v.tipo);
  const espec = v.especificacoes as Record<string, unknown>;

  return {
    ...base,
    tipo: v.tipo,
    placa: v.placa,
    renavam: v.renavam ?? "",
    chassi: v.chassi ?? "",
    numeroMotor: v.numero_motor ?? "",
    ufEmplacamento: v.uf_emplacamento ?? "",
    municipioEmplacamento: v.municipio_emplacamento ?? "",
    marca: v.marca,
    modelo: v.modelo,
    versao: v.versao ?? "",
    anoFab: v.ano_fab?.toString() ?? "",
    anoMod: v.ano_mod?.toString() ?? "",
    cor: v.cor ?? "",
    combustivel: v.combustivel ?? "",
    km: v.km.toString(),
    procedencia: v.procedencia as "nacional" | "importado",
    categoria: v.categoria as "particular" | "aluguel",
    proprietariosAnteriores: v.proprietarios_anteriores.toString(),

    crlvEmDia: v.crlv_em_dia,
    ipvaStatus: v.ipva_status as "Pago" | "Pendente",
    ipvaValor: v.ipva_valor?.toString() ?? "",
    ipvaAno: v.ipva_ano?.toString() ?? "",
    licenciamentoEmDia: v.licenciamento_em_dia,
    multasValor: v.multas_valor.toString(),
    gravame: v.gravame,
    gravameFinanceira: v.gravame_financeira ?? "",
    gravameValorQuitacao: v.gravame_valor_quitacao?.toString() ?? "",
    crvEmMaos: v.crv_em_maos,
    atpve: v.atpve,
    laudoCautelar: v.laudo_cautelar as VeiculoFormState["laudoCautelar"],
    historicoLeilaoSinistro: v.historico_leilao_sinistro,
    chaveReserva: v.chave_reserva,
    manualProprietario: v.manual_proprietario,

    dataEntrada: v.data_entrada,
    origem: v.origem as VeiculoFormState["origem"],
    fornecedor: v.fornecedor ?? "",
    // `valor_compra` e `preco_minimo` não vêm do servidor fora do papel de
    // gestor (`ocultarCamposSensiveis`) — sem o optional chaining, abrir a
    // edição de um veículo como vendedor quebrava a página.
    valorCompra: v.valor_compra?.toString() ?? "",
    formaPagCompra: v.forma_pag_compra ?? "",
    lojaId: v.loja_id ?? "",

    valorFipe: v.valor_fipe?.toString() ?? "",
    precoVenda: v.preco_venda.toString(),
    precoFinanciamento: v.preco_financiamento?.toString() ?? "",
    precoMinimo: v.preco_minimo?.toString() ?? "",

    descricaoAnuncio: v.descricao_anuncio ?? "",
    portaisPublicar: v.portais_publicar,
    observacoes: v.observacoes ?? "",

    custos: v.custos.map((c) => ({
      categoria: c.categoria as VeiculoFormState["custos"][number]["categoria"],
      descricao: c.descricao ?? "",
      fornecedor: c.fornecedor ?? "",
      valor: c.valor.toString(),
      data: c.data,
    })),

    especCarro:
      v.tipo === "carro" ? { ...base.especCarro, ...toStrings(espec) } : base.especCarro,
    especMoto:
      v.tipo === "moto" ? { ...base.especMoto, ...toStrings(espec) } : base.especMoto,
  };
}

function toStrings(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "number" ? v.toString() : v;
  }
  return out;
}

export function numero(valor: string): number {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** "" (placeholder de "não selecionado") vira undefined para não violar um enum zod opcional. */
function vazioParaUndefined<T extends string>(v: T): T | undefined {
  return v === "" ? undefined : v;
}

/** Monta o objeto de especificações no formato que `parseEspecificacoes` espera (números como number, não string). */
export function especificacoesParaPayload(form: VeiculoFormState): Record<string, unknown> {
  if (form.tipo === "carro") {
    const e = form.especCarro;
    return {
      cambio: e.cambio,
      motorizacao: e.motorizacao || undefined,
      potenciaCv: e.potenciaCv ? numero(e.potenciaCv) : undefined,
      portas: e.portas ? Number(e.portas) : undefined,
      carroceria: e.carroceria,
      tracao: vazioParaUndefined(e.tracao),
      blindado: e.blindado,
      blindadoNivel: e.blindadoNivel || undefined,
      finalPlaca: e.finalPlaca || undefined,
      opcionais: e.opcionais,
    };
  }

  const e = form.especMoto;
  return {
    cilindradaCc: e.cilindradaCc ? numero(e.cilindradaCc) : undefined,
    tipo: e.tipo,
    marchas: e.marchas ? Number(e.marchas) : undefined,
    partida: vazioParaUndefined(e.partida),
    refrigeracao: vazioParaUndefined(e.refrigeracao),
    alimentacao: vazioParaUndefined(e.alimentacao),
    freioDianteiro: vazioParaUndefined(e.freioDianteiro),
    freioTraseiro: vazioParaUndefined(e.freioTraseiro),
    sistemaFreio: vazioParaUndefined(e.sistemaFreio),
    tipoRoda: vazioParaUndefined(e.tipoRoda),
    acessorios: e.acessorios,
  };
}
