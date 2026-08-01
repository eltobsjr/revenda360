"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import type { ClienteOpcao } from "./types";

export function ClienteStep({
  clientes,
  clienteId,
  clienteNovoNome,
  clienteNovoCpf,
  onSelecionar,
  onNovoNomeChange,
  onNovoCpfChange,
}: {
  clientes: ClienteOpcao[];
  clienteId: string;
  clienteNovoNome: string;
  clienteNovoCpf: string;
  onSelecionar: (id: string) => void;
  onNovoNomeChange: (v: string) => void;
  onNovoCpfChange: (v: string) => void;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? clientes.filter(
        (c) => c.nome.toLowerCase().includes(termo) || (c.cpf ?? "").includes(termo),
      )
    : clientes;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Buscar por nome ou CPF"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar cliente"
        />
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {filtrados.map((c) => {
            const selecionado = c.id === clienteId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelecionar(c.id)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selecionado ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
                }`}
              >
                <span className="font-medium">{c.nome}</span>
                <span className="text-muted-foreground">{c.cpf ?? "—"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Ou informe um cliente não cadastrado (venda balcão):
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" htmlFor="clienteNovoNome">
            <Input
              id="clienteNovoNome"
              value={clienteNovoNome}
              onChange={(e) => onNovoNomeChange(e.target.value)}
              disabled={!!clienteId}
            />
          </FormField>
          <FormField label="CPF" htmlFor="clienteNovoCpf">
            <Input
              id="clienteNovoCpf"
              value={clienteNovoCpf}
              onChange={(e) => onNovoCpfChange(e.target.value)}
              disabled={!!clienteId}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
