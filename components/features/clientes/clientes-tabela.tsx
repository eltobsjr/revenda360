"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { ClienteListado } from "@/lib/data/clientes";

export function ClientesTabela({
  clientes,
  mostrarCpf,
}: {
  clientes: ClienteListado[];
  mostrarCpf: boolean;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          {mostrarCpf ? <TableHead>CPF</TableHead> : null}
          <TableHead>WhatsApp</TableHead>
          <TableHead>Cidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((c) => (
          <TableRow
            key={c.id}
            className="cursor-pointer"
            onClick={() => router.push(`/clientes/${c.id}`)}
          >
            <TableCell className="font-medium">{c.nome}</TableCell>
            {mostrarCpf ? (
              <TableCell className="text-muted-foreground">
                {"cpf" in c ? (c.cpf ?? "—") : "—"}
              </TableCell>
            ) : null}
            <TableCell className="text-muted-foreground">{c.whatsapp ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{c.cidade ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
