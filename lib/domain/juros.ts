/**
 * Cálculo de juros + multa de parcela em atraso — regra usada tanto para
 * listar/agrupar parcelas em "Contas a receber" quanto para a baixa de
 * parcela. Fórmula validada contra o protótipo (`Revenda360.dc.html`,
 * `computeReceber`): `juros = valor * multaPct/100 + valor * moraPctDia/100 * diasAtraso`,
 * com `multaPct`/`moraPctDia` configuráveis por tenant (`tenant_config`),
 * onde o protótipo tinha 2% e 0,1%/dia fixos no código.
 */

export type StatusParcela = "A vencer" | "Paga" | "Atrasada" | "Parcial" | "Renegociada";

/**
 * Dias corridos entre o vencimento e a data de referência (nunca negativo).
 * `hoje` é normalizado para meia-noite antes da diferença — do contrário, a
 * hora do dia em que a função roda faz uma parcela que vence hoje contar
 * como "1 dia atrasada" a partir do meio-dia (fração de dia decorrida desde
 * a meia-noite de hoje arredondava pra cima).
 */
export function calcularDiasAtraso(vencimento: string, hoje: Date): number {
  const venc = new Date(`${vencimento}T00:00:00`);
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diffMs = hojeMeiaNoite.getTime() - venc.getTime();
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

/** Juros + multa sobre uma parcela em atraso. Sem atraso, não há acréscimo. */
export function calcularJurosMulta(
  valor: number,
  diasAtraso: number,
  multaPct: number,
  moraPctDia: number,
): number {
  if (diasAtraso <= 0) return 0;
  return valor * (multaPct / 100) + valor * (moraPctDia / 100) * diasAtraso;
}

/**
 * Status "efetivo" de uma parcela: o status gravado no banco só muda para
 * `Paga` (na baixa) — nunca há um job/cron marcando `Atrasada` por conta
 * própria. Uma parcela `A vencer` cujo vencimento já passou é tratada como
 * `Atrasada` em tempo de leitura, sem persistir a mudança.
 */
export function statusEfetivo(
  status: StatusParcela,
  vencimento: string,
  hoje: Date,
): StatusParcela {
  if (status === "A vencer" && calcularDiasAtraso(vencimento, hoje) > 0) return "Atrasada";
  return status;
}

/**
 * Quanto se recebe ao quitar um conjunto de parcelas hoje: valor de cada uma
 * mais o acréscimo do seu próprio atraso. É o número mostrado na barra de
 * seleção e no modal de baixa em lote — os dois precisam bater com a soma do
 * que o servidor grava parcela a parcela.
 */
export function totalComJurosMulta(
  parcelas: { valor: number; diasAtraso: number }[],
  multaPct: number,
  moraPctDia: number,
): number {
  return parcelas.reduce(
    (soma, p) => soma + p.valor + calcularJurosMulta(p.valor, p.diasAtraso, multaPct, moraPctDia),
    0,
  );
}
