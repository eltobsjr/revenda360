/**
 * Monta um link `wa.me` para cobrança manual — sem API paga, como decidido
 * no plano de fases. `whatsapp` vem como texto livre do cadastro do cliente
 * (`clientes.whatsapp`), então normalizamos para dígitos e garantimos o
 * código do país (55) antes de montar a URL.
 */
export function linkCobrancaWhatsapp(whatsapp: string, mensagem: string): string {
  const digitos = whatsapp.replace(/\D/g, "");
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
