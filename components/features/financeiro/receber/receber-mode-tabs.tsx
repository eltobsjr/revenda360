import Link from "next/link";
import { cn } from "@/lib/utils";

const MODOS = [
  { id: "parcela", label: "Por parcela" },
  { id: "contrato", label: "Por contrato" },
  { id: "inadimplencia", label: "Inadimplência" },
] as const;

export function ReceberModeTabs({ modoAtivo }: { modoAtivo: string }) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border">
      {MODOS.map((m) => (
        <Link
          key={m.id}
          href={`/financeiro/receber?mode=${m.id}`}
          className={cn(
            "px-3.5 py-1.5 text-sm font-medium transition-colors",
            m.id === modoAtivo
              ? "bg-primary text-primary-foreground"
              : "bg-transparent text-muted-foreground hover:bg-muted",
          )}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
