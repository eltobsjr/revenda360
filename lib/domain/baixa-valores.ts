import { calcularJurosMulta } from "./juros";

/**
 * Números gravados numa baixa de parcela, calculados a partir do que está no
 * banco (valor, quanto já foi pago, vencimento) — nunca do que o client manda.
 *
 * Trabalha sobre o **saldo em aberto** (`valor - valorPago`), não sobre o valor
 * cheio da parcela: numa parcela com pagamento parcial, cobrar juros sobre o
 * valor original cobraria encargo de dinheiro que o cliente já entregou, e
 * gravar `valor_pago` com o valor cheio apagaria a entrada anterior.
 */
export function calcularValoresBaixa(params: {
  valor: number;
  valorPago: number;
  diasAtraso: number;
  desconto: number;
  multaPct: number;
  moraPctDia: number;
}): { juros: number; descontoEfetivo: number; valorPagoTotal: number } {
  const { valor, valorPago, diasAtraso, desconto, multaPct, moraPctDia } = params;

  const saldo = Math.max(0, valor - valorPago);
  const juros = calcularJurosMulta(saldo, diasAtraso, multaPct, moraPctDia);
  // Sem esse teto, um desconto digitado maior que a própria dívida zerava o
  // valor a receber mas gravava `desconto_aplicado` com o número exagerado
  // (ex.: 10000 numa parcela de 500).
  const descontoEfetivo = Math.min(desconto, saldo + juros);
  const aReceberAgora = Math.max(0, saldo + juros - descontoEfetivo);

  return { juros, descontoEfetivo, valorPagoTotal: valorPago + aReceberAgora };
}
