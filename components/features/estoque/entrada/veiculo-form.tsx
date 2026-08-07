"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { salvarVeiculo, salvarFotoVeiculo } from "@/app/(app)/estoque/actions";
import { createClient } from "@/lib/supabase/client";
import { IdentificacaoTab } from "./identificacao-tab";
import { DocumentacaoTab } from "./documentacao-tab";
import { AquisicaoTab } from "./aquisicao-tab";
import { CustosTab } from "./custos-tab";
import { PrecificacaoTab } from "./precificacao-tab";
import { MidiaTab } from "./midia-tab";
import { ObservacoesTab } from "./observacoes-tab";
import { ResumoLateral } from "./resumo-lateral";
import {
  estadoInicialVeiculoForm,
  especificacoesParaPayload,
  numero,
  type VeiculoFormState,
} from "./form-state";
import type { VeiculoFotoRow } from "./types";

const TABS = [
  { id: "identificacao", label: "Identificação" },
  { id: "documentacao", label: "Documentação" },
  { id: "aquisicao", label: "Aquisição" },
  { id: "custos", label: "Custos" },
  { id: "precificacao", label: "Precificação" },
  { id: "midia", label: "Mídia e anúncio" },
  { id: "observacoes", label: "Observações" },
] as const;

export function VeiculoForm({
  estadoInicial,
  veiculoId,
  isGestor,
  lojas,
  tenantId,
  fotosExistentes = [],
  origemTrocaPagamentoId,
}: {
  estadoInicial?: VeiculoFormState;
  veiculoId?: string;
  isGestor: boolean;
  lojas: { id: string; nome: string }[];
  tenantId: string;
  fotosExistentes?: VeiculoFotoRow[];
  /** Fase 9 (Avaliação/Troca): liga o veículo novo de volta ao pagamento que o originou. */
  origemTrocaPagamentoId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VeiculoFormState>(
    estadoInicial ?? estadoInicialVeiculoForm("moto"),
  );
  const [aba, setAba] = useState<string>("identificacao");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [arquivosPendentes, setArquivosPendentes] = useState<
    { file: File; previewUrl: string }[]
  >([]);
  const [capaIndex, setCapaIndex] = useState<number | null>(null);

  function patch(p: Partial<VeiculoFormState>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function trocarTipo(tipo: "carro" | "moto") {
    setForm((f) => ({ ...f, tipo }));
  }

  function salvar() {
    setErro(null);

    if (!form.placa || !form.marca || !form.modelo) {
      setErro("Preencha ao menos placa, marca e modelo na aba Identificação.");
      setAba("identificacao");
      return;
    }

    const criandoConsignado = !veiculoId && form.origem === "Consignado";
    if (criandoConsignado && (!form.consignanteNome || !numero(form.valorRepasse))) {
      setErro("Preencha nome do consignante e valor de repasse na aba Aquisição.");
      setAba("aquisicao");
      return;
    }

    const especificacoesRaw = especificacoesParaPayload(form);

    startTransition(async () => {
      const resultado = await salvarVeiculo({
        veiculoId,
        origemTrocaPagamentoId,
        consignacao: criandoConsignado
          ? {
              consignanteNome: form.consignanteNome,
              consignanteContato: form.consignanteContato,
              valorRepasse: numero(form.valorRepasse),
            }
          : undefined,
        form: {
          tipo: form.tipo,
          placa: form.placa,
          renavam: form.renavam,
          chassi: form.chassi,
          numeroMotor: form.numeroMotor,
          ufEmplacamento: form.ufEmplacamento,
          municipioEmplacamento: form.municipioEmplacamento,
          marca: form.marca,
          modelo: form.modelo,
          versao: form.versao,
          anoFab: form.anoFab ? Number(form.anoFab) : undefined,
          anoMod: form.anoMod ? Number(form.anoMod) : undefined,
          cor: form.cor,
          combustivel: form.combustivel,
          km: numero(form.km),
          procedencia: form.procedencia,
          categoria: form.categoria,
          proprietariosAnteriores: numero(form.proprietariosAnteriores),

          crlvEmDia: form.crlvEmDia,
          ipvaStatus: form.ipvaStatus,
          ipvaValor: form.ipvaValor ? numero(form.ipvaValor) : undefined,
          ipvaAno: form.ipvaAno ? Number(form.ipvaAno) : undefined,
          licenciamentoEmDia: form.licenciamentoEmDia,
          multasValor: numero(form.multasValor),
          gravame: form.gravame,
          gravameFinanceira: form.gravameFinanceira,
          gravameValorQuitacao: form.gravameValorQuitacao
            ? numero(form.gravameValorQuitacao)
            : undefined,
          crvEmMaos: form.crvEmMaos,
          atpve: form.atpve,
          laudoCautelar: form.laudoCautelar,
          historicoLeilaoSinistro: form.historicoLeilaoSinistro,
          chaveReserva: form.chaveReserva,
          manualProprietario: form.manualProprietario,

          dataEntrada: form.dataEntrada,
          origem: form.origem,
          fornecedor: form.fornecedor,
          valorCompra: numero(form.valorCompra),
          formaPagCompra: form.formaPagCompra,
          lojaId: form.lojaId,

          valorFipe: form.valorFipe ? numero(form.valorFipe) : undefined,
          precoVenda: numero(form.precoVenda),
          precoFinanciamento: form.precoFinanciamento
            ? numero(form.precoFinanciamento)
            : undefined,
          precoMinimo: form.precoMinimo ? numero(form.precoMinimo) : undefined,

          descricaoAnuncio: form.descricaoAnuncio,
          portaisPublicar: form.portaisPublicar,
          observacoes: form.observacoes,

          custos: form.custos.map((c) => ({
            categoria: c.categoria,
            descricao: c.descricao,
            fornecedor: c.fornecedor,
            valor: numero(c.valor),
            data: c.data,
          })),
        },
        especificacoesRaw,
      });

      if (resultado.error || !resultado.veiculoId) {
        setErro(resultado.error ?? "Não foi possível salvar o veículo.");
        return;
      }

      if (arquivosPendentes.length > 0) {
        await enviarFotosPendentes(resultado.veiculoId);
      }

      router.push(`/estoque/${resultado.veiculoId}`);
    });
  }

  async function enviarFotosPendentes(idVeiculo: string) {
    const supabase = createClient();
    const ordemInicial = fotosExistentes.length;

    for (let i = 0; i < arquivosPendentes.length; i++) {
      const { file } = arquivosPendentes[i];
      const path = `${tenantId}/${idVeiculo}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("veiculo-fotos")
        .upload(path, file);

      if (uploadError) {
        setErro(`Veículo salvo, mas falhou o envio de "${file.name}": ${uploadError.message}`);
        continue;
      }

      await salvarFotoVeiculo({
        veiculoId: idVeiculo,
        storagePath: path,
        ordem: ordemInicial + i,
        capa: capaIndex === i,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <Card>
        <CardContent>
          {!veiculoId ? (
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="tipo-veiculo" className="text-sm text-muted-foreground">
                Tipo:
              </label>
              <NativeSelect
                id="tipo-veiculo"
                value={form.tipo}
                onChange={(e) => trocarTipo(e.target.value as "carro" | "moto")}
                className="w-32"
              >
                <NativeSelectOption value="moto">Moto</NativeSelectOption>
                <NativeSelectOption value="carro">Carro</NativeSelectOption>
              </NativeSelect>
            </div>
          ) : null}

          <Tabs value={aba} onValueChange={setAba}>
            <TabsList className="flex-wrap">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="identificacao" className="pt-4">
              <IdentificacaoTab form={form} patch={patch} />
            </TabsContent>
            <TabsContent value="documentacao" className="pt-4">
              <DocumentacaoTab form={form} patch={patch} />
            </TabsContent>
            <TabsContent value="aquisicao" className="pt-4">
              <AquisicaoTab form={form} patch={patch} lojas={lojas} criando={!veiculoId} />
            </TabsContent>
            <TabsContent value="custos" className="pt-4">
              <CustosTab form={form} patch={patch} />
            </TabsContent>
            <TabsContent value="precificacao" className="pt-4">
              <PrecificacaoTab form={form} patch={patch} isGestor={isGestor} />
            </TabsContent>
            <TabsContent value="midia" className="pt-4">
              <MidiaTab
                form={form}
                patch={patch}
                veiculoId={veiculoId}
                fotosExistentes={fotosExistentes}
                arquivosPendentes={arquivosPendentes}
                onArquivosPendentesChange={setArquivosPendentes}
                capaIndex={capaIndex}
                onCapaIndexChange={setCapaIndex}
              />
            </TabsContent>
            <TabsContent value="observacoes" className="pt-4">
              <ObservacoesTab form={form} patch={patch} />
            </TabsContent>
          </Tabs>

          {erro ? <p className="mt-4 text-sm text-destructive">{erro}</p> : null}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" disabled={pending} onClick={salvar}>
              {pending ? "Salvando…" : veiculoId ? "Salvar alterações" : "Cadastrar veículo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="hidden lg:block">
        <ResumoLateral form={form} />
      </div>
    </div>
  );
}
