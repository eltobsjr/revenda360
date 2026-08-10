import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/**
 * Não existe avatar/foto de usuário no sistema (só de veículo) — mostrar
 * iniciais do nome é honesto em vez de inventar uma imagem.
 */
function calcularIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function AvatarIniciais({
  nome,
  size = "default",
}: {
  nome: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback>{calcularIniciais(nome)}</AvatarFallback>
    </Avatar>
  );
}
