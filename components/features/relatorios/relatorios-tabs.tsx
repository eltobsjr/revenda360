import Link from "next/link";
import { cn } from "@/lib/utils";

const ABAS = [
  { id: "estoque", label: "Estoque" },
  { id: "vendas", label: "Vendas & Recebíveis" },
  { id: "pagar", label: "Contas a pagar" },
] as const;

export function RelatoriosTabs({
  abaAtiva,
  mostrarPagar,
}: {
  abaAtiva: string;
  mostrarPagar: boolean;
}) {
  const abas = mostrarPagar ? ABAS : ABAS.filter((a) => a.id !== "pagar");

  return (
    <nav aria-label="Relatórios" className="flex overflow-hidden rounded-md border border-border w-fit">
      {abas.map((a) => (
        <Link
          key={a.id}
          href={`/relatorios?aba=${a.id}`}
          className={cn(
            "px-3.5 py-1.5 text-sm font-medium transition-colors",
            a.id === abaAtiva
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:bg-muted",
          )}
        >
          {a.label}
        </Link>
      ))}
    </nav>
  );
}
