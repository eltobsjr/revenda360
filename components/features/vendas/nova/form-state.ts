export type NovaVendaFormState = {
  veiculoId: string;

  clienteId: string;
  clienteNovoNome: string;
  clienteNovoCpf: string;

  valorVenda: string;
  desconto: string;
  temTroca: boolean;
  trocaDescricao: string;
  trocaValor: string;

  pagEntradaValor: string;
  pagEntradaForma: "dinheiro" | "pix" | "cartao" | "transferencia";
  pagFinanciamento: string;
  pagCrediario: string;

  crediarioQtd: string;
  crediarioTaxa: string;
  crediarioPrimeiroVenc: string;

  vendedorId: string;
  comissaoPct: string;
  garantia: string;
  observacoes: string;
};

export function estadoInicialNovaVenda(
  vendedorId: string,
  inicial?: { clienteId?: string; veiculoId?: string; valorVenda?: string },
): NovaVendaFormState {
  const hoje = new Date();
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());

  return {
    veiculoId: inicial?.veiculoId ?? "",

    clienteId: inicial?.clienteId ?? "",
    clienteNovoNome: "",
    clienteNovoCpf: "",

    valorVenda: inicial?.valorVenda ?? "",
    desconto: "0",
    temTroca: false,
    trocaDescricao: "",
    trocaValor: "0",

    pagEntradaValor: "0",
    pagEntradaForma: "pix",
    pagFinanciamento: "0",
    pagCrediario: "0",

    crediarioQtd: "6",
    crediarioTaxa: "2.5",
    crediarioPrimeiroVenc: proximoMes.toISOString().slice(0, 10),

    vendedorId,
    comissaoPct: "3",
    garantia: "Nota promissória",
    observacoes: "",
  };
}

export function numero(valor: string): number {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
