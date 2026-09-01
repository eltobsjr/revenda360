export type SituacaoCliente = "A vencer" | "Pago" | "Atrasado 1x" | "Atrasado 2x";

/**
 * Situação de cobrança de um cliente, agregada por contagem de parcelas
 * atualmente em atraso (não por faixa de dias) — pedido explícito do
 * usuário: "Atrasado 1x"/"Atrasado 2x" contam quantas parcelas estão em
 * atraso agora, não há quanto tempo.
 */
export function situacaoCliente(valorPendente: number, qtdParcelasAtrasadas: number): SituacaoCliente {
  if (qtdParcelasAtrasadas >= 2) return "Atrasado 2x";
  if (qtdParcelasAtrasadas === 1) return "Atrasado 1x";
  // Arredonda a centavos: subtração de valores monetários em ponto flutuante
  // pode deixar um resíduo como 0,0000000001 num contrato quitado.
  return Math.round(valorPendente * 100) <= 0 ? "Pago" : "A vencer";
}
