"use client";

import { useState, useTransition } from "react";
import { criarFornecedorRapido } from "@/app/(app)/fornecedores/actions";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Select de fornecedor cadastrado (Fase 16), com opção de cadastrar um novo sem sair da tela. */
export function FornecedorSelect({
  fornecedores,
  value,
  onChange,
}: {
  fornecedores: { id: string; nome: string }[];
  value: string;
  onChange: (fornecedorId: string, nome: string) => void;
}) {
  const [lista, setLista] = useState(fornecedores);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function criar() {
    if (!nome.trim()) {
      setErro("Informe o nome.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await criarFornecedorRapido({ nome, contato });
      if (resultado.error || !resultado.fornecedor) {
        setErro(resultado.error ?? "Não foi possível cadastrar o fornecedor.");
        return;
      }
      setLista((l) => [...l, resultado.fornecedor!]);
      onChange(resultado.fornecedor.id, resultado.fornecedor.nome);
      setNome("");
      setContato("");
      setOpen(false);
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <NativeSelect
          id="fornecedorId"
          value={value}
          onChange={(e) => {
            const f = lista.find((x) => x.id === e.target.value);
            onChange(e.target.value, f?.nome ?? "");
          }}
        >
          <NativeSelectOption value="">— nenhum fornecedor cadastrado —</NativeSelectOption>
          {lista.map((f) => (
            <NativeSelectOption key={f.id} value={f.id}>
              {f.nome}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
          Novo
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar fornecedor</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FormField label="Nome" htmlFor="fornecedorNomeRapido">
              <Input id="fornecedorNomeRapido" value={nome} onChange={(e) => setNome(e.target.value)} />
            </FormField>
            <FormField label="Contato" htmlFor="fornecedorContatoRapido">
              <Input
                id="fornecedorContatoRapido"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
              />
            </FormField>
            {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
            <Button type="button" disabled={pending} onClick={criar}>
              {pending ? "Salvando…" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
