import Link from "next/link";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button, buttonVariants } from "@/components/ui/button";

const STATUS_OPCOES = [
  "Disponível",
  "Em preparação",
  "Reservado",
  "Vendido",
  "Consignado",
  "Repasse",
  "Devolvido",
] as const;

export function EstoqueFiltros({
  busca,
  tipo,
  status,
  marca,
  marcasDisponiveis,
  visao,
}: {
  busca?: string;
  tipo?: string;
  status?: string;
  marca?: string;
  marcasDisponiveis: string[];
  visao: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3" action="/estoque">
      <input type="hidden" name="visao" value={visao} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="busca" className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
        <Input
          id="busca"
          name="busca"
          placeholder="Placa, modelo ou chassi"
          defaultValue={busca}
          className="w-56"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tipo" className="text-xs font-medium text-muted-foreground">
          Tipo
        </label>
        <NativeSelect id="tipo" name="tipo" defaultValue={tipo ?? ""} className="w-32">
          <NativeSelectOption value="">Todos</NativeSelectOption>
          <NativeSelectOption value="carro">Carro</NativeSelectOption>
          <NativeSelectOption value="moto">Moto</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <NativeSelect id="status" name="status" defaultValue={status ?? ""} className="w-40">
          <NativeSelectOption value="">Todos</NativeSelectOption>
          {STATUS_OPCOES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {s}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="marca" className="text-xs font-medium text-muted-foreground">
          Marca
        </label>
        <NativeSelect id="marca" name="marca" defaultValue={marca ?? ""} className="w-36">
          <NativeSelectOption value="">Todas</NativeSelectOption>
          {marcasDisponiveis.map((m) => (
            <NativeSelectOption key={m} value={m}>
              {m}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" size="sm">
        Filtrar
      </Button>
      <Link href="/estoque" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Limpar
      </Link>
    </form>
  );
}
