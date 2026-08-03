/**
 * Funções puras de precificação de veículo — sem I/O, reaproveitadas em toda
 * tela que mostra custo/margem (lista de Estoque, Ficha do veículo, Entrada
 * de veículo, wizard de venda).
 */

/** Custo total = valor de compra + soma de todos os custos lançados. */
export function custoTotal(valorCompra: number, custos: number[]): number {
  return valorCompra + custos.reduce((total, c) => total + c, 0);
}

/** Margem em R$ = preço de venda − custo total. */
export function margemR(precoVenda: number, custoTotalVeiculo: number): number {
  return precoVenda - custoTotalVeiculo;
}

/** Margem em % sobre o preço de venda. Retorna 0 se o preço de venda for 0 (evita divisão por zero). */
export function margemPct(margemRVeiculo: number, precoVenda: number): number {
  if (precoVenda <= 0) return 0;
  return (margemRVeiculo / precoVenda) * 100;
}

/**
 * Preço mínimo de negociação efetivo: usa o campo cadastrado no veículo se
 * existir; senão cai no fallback configurável do tenant (margem mínima
 * default sobre o custo total). Resolve a ambiguidade do protótipo, onde o
 * wizard de venda usava `custoTotal * 1.08` fixo em vez de ler o campo
 * cadastrado — ver decisão registrada no SecondBrain.
 */
export function precoMinimoEfetivo(
  precoMinimoCadastrado: number | null | undefined,
  custoTotalVeiculo: number,
  margemMinimaPctDefault: number,
): number {
  if (precoMinimoCadastrado != null) return precoMinimoCadastrado;
  return custoTotalVeiculo * (1 + margemMinimaPctDefault / 100);
}

/**
 * Dias em estoque = diferença em dias corridos entre a data de entrada e a
 * data de referência (hoje). `hoje` é normalizado para meia-noite antes da
 * diferença — sem isso, a hora do dia em que a função roda faz a conta
 * "vazar" um dia a mais (ex.: entrada há exatamente 30 dias, rodando às
 * 15h, dava 31 dias por causa da fração de dia decorrida desde a meia-noite
 * de hoje).
 */
export function diasEstoque(dataEntrada: Date | string, hoje: Date): number {
  const entrada =
    typeof dataEntrada === "string" ? new Date(`${dataEntrada}T00:00:00`) : dataEntrada;
  const hojeMeiaNoite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diffMs = hojeMeiaNoite.getTime() - entrada.getTime();
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

export type CampoSensivel =
  | "preco_minimo"
  | "valor_compra"
  | "margem_r"
  | "margem_pct"
  | "custo_total";

const CAMPOS_SENSIVEIS: readonly CampoSensivel[] = [
  "preco_minimo",
  "valor_compra",
  "margem_r",
  "margem_pct",
  "custo_total",
];

/**
 * Remove os campos sensíveis (preço mínimo, margem, custo de aquisição) de um
 * objeto quando o papel do usuário não é gestor. Usado na camada de acesso a
 * dados (`lib/data/*`) antes de repassar ao Client Component.
 */
export function ocultarCamposSensiveis<T extends Record<string, unknown>>(
  registro: T,
  role: "gestor" | "vendedor" | "financeiro",
): T {
  if (role === "gestor") return registro;
  const copia = { ...registro };
  for (const campo of CAMPOS_SENSIVEIS) {
    if (campo in copia) {
      delete (copia as Record<string, unknown>)[campo];
    }
  }
  return copia;
}
