/** Formata um valor numérico como moeda brasileira (R$ 1.234,56). */
export function formatBRL(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Formata uma data (string "YYYY-MM-DD" ou Date) como dd/mm/aaaa. */
export function formatDataBR(data: string | Date | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(`${data}T00:00:00`) : data;
  return d.toLocaleDateString("pt-BR");
}

/** Formata um inteiro com separador de milhar brasileiro (ex.: 42.300). */
export function formatInt(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}
