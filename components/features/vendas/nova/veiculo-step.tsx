"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/format";
import type { VeiculoOpcao } from "./types";

export function VeiculoStep({
  veiculos,
  veiculoId,
  onSelecionar,
}: {
  veiculos: VeiculoOpcao[];
  veiculoId: string;
  onSelecionar: (id: string) => void;
}) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? veiculos.filter(
        (v) =>
          v.placa.toLowerCase().includes(termo) ||
          v.marca.toLowerCase().includes(termo) ||
          v.modelo.toLowerCase().includes(termo),
      )
    : veiculos;

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por placa, marca ou modelo"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        aria-label="Buscar veículo"
      />
      <div className="flex flex-col gap-2">
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum veículo disponível encontrado.
          </p>
        ) : null}
        {filtrados.map((v) => {
          const selecionado = v.id === veiculoId;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelecionar(v.id)}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selecionado ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
              }`}
            >
              <span>
                <span className="font-medium">
                  {v.marca} {v.modelo}
                </span>{" "}
                <span className="text-muted-foreground">— {v.placa}</span>
              </span>
              <span className="tabular-nums font-medium">{formatBRL(v.preco_venda)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
