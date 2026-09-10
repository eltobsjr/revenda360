import { dataIsoLocal } from "./datas";

/**
 * Filtros da tela de Contas a receber. Lógica pura, separada dos componentes:
 * é onde mora o risco de erro (limites de faixa, mês corrente, "vence hoje"),
 * e assim dá para testar sem browser.
 */

export type FiltroVencimento = "todos" | "vencidas" | "este-mes" | "proximos-30" | "futuras";
export type FiltroAtraso = "todos" | "1-30" | "31-60" | "61-90" | "90+";

/** Minúsculas, sem acento e sem espaço sobrando — dos dois lados da comparação. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * O termo aparece em algum dos campos? Termo vazio casa com tudo, para o
 * campo de busca em branco não esconder linha nenhuma.
 */
export function casaBusca(termo: string, campos: string[]): boolean {
  const alvo = normalizarBusca(termo);
  if (alvo === "") return true;
  return campos.some((campo) => normalizarBusca(campo).includes(alvo));
}

function somarDias(data: Date, dias: number): Date {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  d.setDate(d.getDate() + dias);
  return d;
}

/**
 * Comparações são feitas em texto ISO (YYYY-MM-DD), que ordena
 * lexicograficamente igual à data — evita `new Date` em fuso, que já causou
 * bug de "um dia a mais" neste projeto (ver `dataIsoLocal`).
 */
export function dentroDoVencimento(
  vencimento: string,
  filtro: FiltroVencimento,
  hoje: Date,
): boolean {
  if (filtro === "todos") return true;

  const hojeIso = dataIsoLocal(hoje);

  switch (filtro) {
    case "vencidas":
      return vencimento < hojeIso;
    case "futuras":
      return vencimento > hojeIso;
    case "proximos-30":
      // Inclui hoje e o trigésimo dia — é a janela de cobrança do mês à frente.
      return vencimento >= hojeIso && vencimento <= dataIsoLocal(somarDias(hoje, 30));
    case "este-mes": {
      const primeiro = dataIsoLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
      const ultimo = dataIsoLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0));
      return vencimento >= primeiro && vencimento <= ultimo;
    }
  }
}

/**
 * Faixas de aging, contíguas e sem sobreposição: 1-30, 31-60, 61-90 e acima
 * de 90. Parcela sem atraso (0 dias) não pertence a faixa nenhuma.
 */
export function dentroDoAtraso(diasAtraso: number, filtro: FiltroAtraso): boolean {
  if (filtro === "todos") return true;
  if (diasAtraso < 1) return false;

  switch (filtro) {
    case "1-30":
      return diasAtraso <= 30;
    case "31-60":
      return diasAtraso >= 31 && diasAtraso <= 60;
    case "61-90":
      return diasAtraso >= 61 && diasAtraso <= 90;
    case "90+":
      return diasAtraso > 90;
  }
}
