/**
 * Interpreta um valor em reais digitado à mão (campo de desconto, por
 * exemplo), aceitando o formato brasileiro. Devolve `null` quando o texto não
 * é um valor válido — quem chama decide a mensagem de erro.
 *
 * Existe porque o parse anterior era `Number(texto.replace(",", "."))`, que só
 * trocava a vírgula: "1.500,00" virava "1.500.00" → NaN → (com o `|| 0` da
 * action) desconto zero, e "1.500" virava 1,5. Nos dois casos a baixa era
 * gravada com um desconto que não foi o digitado, sem erro nenhum na tela.
 */
export function parseValorBRL(texto: string): number | null {
  const limpo = texto.replace(/\s/g, "").replace(/^R\$/i, "");
  if (limpo === "") return 0;
  if (!/^[\d.,]+$/.test(limpo)) return null;

  const virgulas = limpo.split(",").length - 1;
  if (virgulas > 1) return null;

  let normalizado: string;
  if (virgulas === 1) {
    // Com vírgula, ela é o separador decimal e todo ponto é milhar.
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (limpo.includes(".")) {
    // Sem vírgula o ponto é ambíguo. Se todo grupo depois de um ponto tem
    // exatamente 3 dígitos ("1.500", "1.234.567"), é milhar — é o que um
    // usuário brasileiro quis dizer. Caso contrário ("1.5", "0.99") é
    // decimal, o que cobre quem digita no formato en-US.
    const grupos = limpo.split(".");
    const milhar = grupos.slice(1).every((g) => /^\d{3}$/.test(g)) && /^\d{1,3}$/.test(grupos[0]);
    if (milhar) normalizado = grupos.join("");
    else if (grupos.length === 2) normalizado = limpo;
    else return null;
  } else {
    normalizado = limpo;
  }

  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0) return null;
  return valor;
}
