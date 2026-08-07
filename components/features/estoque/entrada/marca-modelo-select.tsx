"use client";

import { useMemo, useState, useTransition } from "react";
import { criarMarcaRapida, criarModeloRapido } from "@/app/(app)/marcas-modelos/actions";
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
import type { MarcaComModelos } from "@/lib/data/marcas-modelos";

/**
 * Assiste o preenchimento de marca/modelo (Fase 17) — os campos que
 * realmente valem são os de texto livre já existentes (`onMarcaChange`/
 * `onModeloChange` escrevem neles), esse componente só ajuda a escolher (ou
 * cadastrar, sem sair da tela) valores já padronizados no catálogo.
 */
export function MarcaModeloSelect({
  marcas,
  onMarcaChange,
  onModeloChange,
}: {
  marcas: MarcaComModelos[];
  onMarcaChange: (nome: string) => void;
  onModeloChange: (nome: string) => void;
}) {
  const [lista, setLista] = useState(marcas);
  const [marcaId, setMarcaId] = useState("");
  const [dialogMarcaAberto, setDialogMarcaAberto] = useState(false);
  const [dialogModeloAberto, setDialogModeloAberto] = useState(false);
  const [nomeNovaMarca, setNomeNovaMarca] = useState("");
  const [nomeNovoModelo, setNomeNovoModelo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const marcaSelecionada = lista.find((m) => m.id === marcaId);
  const modelos = useMemo(() => marcaSelecionada?.modelos ?? [], [marcaSelecionada]);

  function criarMarca() {
    if (!nomeNovaMarca.trim()) {
      setErro("Informe o nome.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await criarMarcaRapida(nomeNovaMarca);
      if (resultado.error || !resultado.marca) {
        setErro(resultado.error ?? "Não foi possível cadastrar a marca.");
        return;
      }
      setLista((l) => [...l, { ...resultado.marca!, ativo: true, modelos: [] }]);
      setMarcaId(resultado.marca.id);
      onMarcaChange(resultado.marca.nome);
      onModeloChange("");
      setNomeNovaMarca("");
      setDialogMarcaAberto(false);
    });
  }

  function criarModelo() {
    if (!marcaId) {
      setErro("Escolha uma marca primeiro.");
      return;
    }
    if (!nomeNovoModelo.trim()) {
      setErro("Informe o nome.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const resultado = await criarModeloRapido(marcaId, nomeNovoModelo);
      if (resultado.error || !resultado.modelo) {
        setErro(resultado.error ?? "Não foi possível cadastrar o modelo.");
        return;
      }
      setLista((l) =>
        l.map((m) =>
          m.id === marcaId ? { ...m, modelos: [...m.modelos, { ...resultado.modelo!, ativo: true }] } : m,
        ),
      );
      onModeloChange(resultado.modelo.nome);
      setNomeNovoModelo("");
      setDialogModeloAberto(false);
    });
  }

  return (
    <>
      <FormField label="Selecionar do catálogo" htmlFor="marcaCadastradaId">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <NativeSelect
              id="marcaCadastradaId"
              value={marcaId}
              onChange={(e) => {
                setMarcaId(e.target.value);
                const m = lista.find((x) => x.id === e.target.value);
                onMarcaChange(m?.nome ?? "");
                onModeloChange("");
              }}
            >
              <NativeSelectOption value="">— nenhuma marca cadastrada —</NativeSelectOption>
              {lista.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  {m.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Dialog open={dialogMarcaAberto} onOpenChange={setDialogMarcaAberto}>
            <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
              Nova marca
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar marca</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <FormField label="Nome" htmlFor="nomeNovaMarca">
                  <Input
                    id="nomeNovaMarca"
                    value={nomeNovaMarca}
                    onChange={(e) => setNomeNovaMarca(e.target.value)}
                  />
                </FormField>
                {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
                <Button type="button" disabled={pending} onClick={criarMarca}>
                  {pending ? "Salvando…" : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FormField>

      <FormField label="Modelo cadastrado" htmlFor="modeloCadastradoId">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <NativeSelect
              id="modeloCadastradoId"
              disabled={!marcaId}
              onChange={(e) => onModeloChange(e.target.value)}
            >
              <NativeSelectOption value="">
                {marcaId ? "— nenhum modelo cadastrado —" : "— escolha uma marca primeiro —"}
              </NativeSelectOption>
              {modelos.map((mo) => (
                <NativeSelectOption key={mo.id} value={mo.nome}>
                  {mo.nome}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Dialog open={dialogModeloAberto} onOpenChange={setDialogModeloAberto}>
            <DialogTrigger
              render={<Button type="button" variant="outline" size="sm" disabled={!marcaId} />}
            >
              Novo modelo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar modelo em {marcaSelecionada?.nome}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <FormField label="Nome" htmlFor="nomeNovoModelo">
                  <Input
                    id="nomeNovoModelo"
                    value={nomeNovoModelo}
                    onChange={(e) => setNomeNovoModelo(e.target.value)}
                  />
                </FormField>
                {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
                <Button type="button" disabled={pending} onClick={criarModelo}>
                  {pending ? "Salvando…" : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FormField>
    </>
  );
}
