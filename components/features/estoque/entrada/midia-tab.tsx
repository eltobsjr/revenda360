"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { PORTAIS_DISPONIVEIS } from "@/lib/validation/veiculo.schema";
import { criarUrlAssinadaFoto, removerFotoVeiculo } from "@/app/(app)/estoque/actions";
import type { VeiculoFotoRow } from "./types";
import type { VeiculoFormState } from "./form-state";

type ArquivoPendente = { file: File; previewUrl: string };

export function MidiaTab({
  form,
  patch,
  veiculoId,
  fotosExistentes,
  arquivosPendentes,
  onArquivosPendentesChange,
  capaIndex,
  onCapaIndexChange,
}: {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
  veiculoId?: string;
  fotosExistentes: VeiculoFotoRow[];
  arquivosPendentes: ArquivoPendente[];
  onArquivosPendentesChange: (arquivos: ArquivoPendente[]) => void;
  capaIndex: number | null;
  onCapaIndexChange: (index: number | null) => void;
}) {
  const [urlsExistentes, setUrlsExistentes] = useState<Record<string, string>>({});
  const [idsRemovidos, setIdsRemovidos] = useState<Set<string>>(new Set());
  // Memoizado porque a lista entra nas dependências do efeito abaixo: um
  // `filter` solto devolve um array novo a cada render, o efeito rodava de
  // novo, gravava as URLs no state, o state disparava outro render — laço
  // infinito pedindo URL assinada ao servidor sem parar.
  const fotos = useMemo(
    () => fotosExistentes.filter((f) => !idsRemovidos.has(f.id)),
    [fotosExistentes, idsRemovidos],
  );

  useEffect(() => {
    let ativo = true;
    Promise.all(
      fotos.map(async (f) => [f.storage_path, await criarUrlAssinadaFoto(f.storage_path)] as const),
    ).then((pares) => {
      if (!ativo) return;
      const validas = pares.filter(
        (par): par is [string, string] => par[1] !== null,
      );
      setUrlsExistentes(Object.fromEntries(validas));
    });
    return () => {
      ativo = false;
    };
  }, [fotos]);

  function selecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    const novos = arquivos.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    onArquivosPendentesChange([...arquivosPendentes, ...novos]);
    e.target.value = "";
  }

  function removerPendente(index: number) {
    onArquivosPendentesChange(arquivosPendentes.filter((_, i) => i !== index));
    if (capaIndex === index) onCapaIndexChange(null);
  }

  async function removerExistente(foto: VeiculoFotoRow) {
    setIdsRemovidos((prev) => new Set(prev).add(foto.id));
    if (veiculoId) {
      await removerFotoVeiculo({
        fotoId: foto.id,
        storagePath: foto.storage_path,
        veiculoId,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fotos
        </p>
        <div className="flex flex-wrap gap-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="relative h-24 w-32 overflow-hidden rounded-md border">
              {urlsExistentes[foto.storage_path] ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada de bucket privado, sem otimização do next/image aplicável
                <img
                  src={urlsExistentes[foto.storage_path]}
                  alt="Foto do veículo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              {foto.capa ? (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Capa
                </span>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                className="absolute top-1 right-1"
                aria-label="Remover foto"
                onClick={() => removerExistente(foto)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          {arquivosPendentes.map((pendente, i) => (
            <div key={i} className="relative h-24 w-32 overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local via blob URL, não passa por otimização */}
              <img
                src={pendente.previewUrl}
                alt="Nova foto"
                className="h-full w-full object-cover"
              />
              {capaIndex === i ? (
                <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Capa
                </span>
              ) : null}
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  aria-label="Marcar como capa"
                  onClick={() => onCapaIndexChange(i)}
                >
                  <Star />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Remover foto"
                  onClick={() => removerPendente(i)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}

          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:border-primary/40 hover:text-primary">
            <Upload className="size-5" />
            <span className="text-xs">Adicionar fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={selecionarArquivos}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          As fotos novas são enviadas quando você salvar o veículo.
        </p>
      </div>

      <FormField label="Descrição do anúncio" htmlFor="descricaoAnuncio">
        <Textarea
          id="descricaoAnuncio"
          value={form.descricaoAnuncio}
          onChange={(e) => patch({ descricaoAnuncio: e.target.value })}
          rows={4}
        />
      </FormField>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Portais para publicar
        </p>
        <p className="mb-2 text-xs text-muted-foreground">
          Publicação é manual nesta fase — sem integração automática com os portais ainda.
        </p>
        <div className="flex flex-wrap gap-4">
          {PORTAIS_DISPONIVEIS.map((portal) => (
            <label key={portal} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.portaisPublicar.includes(portal)}
                onCheckedChange={(checked) =>
                  patch({
                    portaisPublicar: checked
                      ? [...form.portaisPublicar, portal]
                      : form.portaisPublicar.filter((p) => p !== portal),
                  })
                }
              />
              {portal}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
