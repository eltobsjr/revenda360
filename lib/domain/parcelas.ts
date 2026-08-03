/**
 * Geração de parcelas de crediário próprio (carnê da loja) — fórmula de juros
 * simples validada contra o protótipo: o total financiado é acrescido de
 * `taxa% * (qtd/2)` (aproximação de juros simples sobre o prazo médio de
 * exposição) e dividido em parcelas iguais.
 */

export type Parcela = {
  numero: number;
  vencimento: string;
  valor: number;
};

export function gerarParcelas(
  valorBase: number,
  taxaJurosMensalPct: number,
  qtdParcelas: number,
  dataPrimeiroVencimento: string,
): Parcela[] {
  const valorComJuros = valorBase * (1 + (taxaJurosMensalPct / 100) * (qtdParcelas / 2));

  // Divisão em centavos com o resto na última parcela: arredondar cada parcela
  // isoladamente fazia a soma do carnê não fechar com o valor financiado
  // (R$ 1.000 em 3x virava 3 × 333,33 = 999,99), e é essa soma que vira o
  // `valor_total` do contrato no `fechar_venda`.
  const totalCentavos = Math.round(valorComJuros * 100);
  const centavosPorParcela = Math.floor(totalCentavos / qtdParcelas);
  const restoCentavos = totalCentavos - centavosPorParcela * qtdParcelas;

  return Array.from({ length: qtdParcelas }, (_, i) => ({
    numero: i + 1,
    vencimento: adicionarMeses(dataPrimeiroVencimento, i),
    valor: (centavosPorParcela + (i === qtdParcelas - 1 ? restoCentavos : 0)) / 100,
  }));
}

/**
 * Soma meses a uma data (formato YYYY-MM-DD) usando o rollover nativo de
 * `Date` (dia 31 + 1 mês em um mês mais curto "transborda" para o mês
 * seguinte) — mesmo comportamento do protótipo, não um comportamento
 * "corrigido" à parte.
 */
export function adicionarMeses(dataIso: string, meses: number): string {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1 + meses, dia));
  return d.toISOString().slice(0, 10);
}
