import { headers } from "next/headers";

/**
 * Base URL do app pra montar links absolutos (ex.: definir senha). Usa
 * `NEXT_PUBLIC_SITE_URL` se configurada; senão deduz do host da requisição
 * (funciona em localhost e em preview deploys sem configuração extra).
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
