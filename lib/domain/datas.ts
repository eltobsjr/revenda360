/**
 * Data (YYYY-MM-DD) no fuso local, para gravar/preencher campos `date` do
 * banco. `toISOString().slice(0, 10)` não serve: converte para UTC antes de
 * formatar, então no Brasil (UTC-3) qualquer horário a partir das 21h já cai
 * no dia seguinte — uma baixa de parcela feita às 21h30 era gravada com a
 * data de amanhã.
 */
export function dataIsoLocal(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}
