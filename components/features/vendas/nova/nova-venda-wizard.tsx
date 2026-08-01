"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { fecharVenda } from "@/app/(app)/vendas/nova/actions";
import { gerarParcelas, type Parcela } from "@/lib/domain/parcelas";
import { VeiculoStep } from "./veiculo-step";
import { ClienteStep } from "./cliente-step";
import { NegociacaoStep } from "./negociacao-step";
import { PagamentoStep } from "./pagamento-step";
import { CrediarioStep } from "./crediario-step";
import { DocumentosStep } from "./documentos-step";
import { ConfirmacaoStep } from "./confirmacao-step";
import { estadoInicialNovaVenda, numero, type NovaVendaFormState } from "./form-state";
import type { ClienteOpcao, VendedorOpcao, VeiculoOpcao } from "./types";
import type { TipoPagamento } from "@/types/database.types";

const ETAPAS = [
  { id: "veiculo", label: "Veículo" },
  { id: "cliente", label: "Cliente" },
  { id: "negociacao", label: "Negociação" },
  { id: "pagamento", label: "Pagamento" },
  { id: "crediario", label: "Crediário" },
  { id: "documentos", label: "Documentos" },
  { id: "confirmacao", label: "Confirmação" },
] as const;

export function NovaVendaWizard({
  veiculos,
  clientes,
  vendedores,
  vendedorAtualId,
  margemMinimaPctDefault,
}: {
  veiculos: VeiculoOpcao[];
  clientes: ClienteOpcao[];
  vendedores: VendedorOpcao[];
  vendedorAtualId: string;
  margemMinimaPctDefault: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState<NovaVendaFormState>(
    estadoInicialNovaVenda(vendedorAtualId),
  );
  const [etapa, setEtapa] = useState<string>("veiculo");
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(p: Partial<NovaVendaFormState>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function selecionarVeiculo(id: string) {
    const veiculo = veiculos.find((v) => v.id === id);
    setForm((f) => ({
      ...f,
      veiculoId: id,
      valorVenda: f.valorVenda || (veiculo ? String(veiculo.preco_venda) : f.valorVenda),
    }));
  }

  function selecionarCliente(id: string) {
    patch({ clienteId: id === form.clienteId ? "" : id });
  }

  function handleGerarParcelas() {
    const qtd = Math.max(1, parseInt(form.crediarioQtd, 10) || 1);
    setParcelas(
      gerarParcelas(
        numero(form.pagCrediario),
        numero(form.crediarioTaxa),
        qtd,
        form.crediarioPrimeiroVenc,
      ),
    );
  }

  function editarParcela(numeroParcela: number, valor: string) {
    setParcelas((prev) =>
      prev.map((p) => (p.numero === numeroParcela ? { ...p, valor: numero(valor) } : p)),
    );
  }

  const veiculoSelecionado = veiculos.find((v) => v.id === form.veiculoId);
  const clienteSelecionado = clientes.find((c) => c.id === form.clienteId);
  const vendedorSelecionado = vendedores.find((v) => v.id === form.vendedorId);

  const total = numero(form.valorVenda) - numero(form.desconto);
  const troca = form.temTroca ? numero(form.trocaValor) : 0;
  const somaPagamentos =
    troca + numero(form.pagEntradaValor) + numero(form.pagFinanciamento) + numero(form.pagCrediario);
  const falta = Math.round((total - somaPagamentos) * 100) / 100;
  const composicaoCompleta = Math.abs(falta) < 0.5;
  const crediarioPendente = numero(form.pagCrediario) > 0 && parcelas.length === 0;

  const avisos: string[] = [];
  if (!form.veiculoId) avisos.push("Selecione um veículo na etapa Veículo.");
  if (!composicaoCompleta)
    avisos.push("A composição do pagamento ainda não fecha com o valor final.");
  if (crediarioPendente) avisos.push("Gere as parcelas do crediário antes de confirmar.");

  function montarPagamentos() {
    const pagamentos: { tipo: TipoPagamento; valor: number; detalhes?: Record<string, unknown> }[] =
      [];
    if (form.temTroca && numero(form.trocaValor) > 0) {
      pagamentos.push({
        tipo: "troca",
        valor: numero(form.trocaValor),
        detalhes: { descricao: form.trocaDescricao },
      });
    }
    if (numero(form.pagEntradaValor) > 0) {
      pagamentos.push({ tipo: form.pagEntradaForma, valor: numero(form.pagEntradaValor) });
    }
    if (numero(form.pagFinanciamento) > 0) {
      pagamentos.push({ tipo: "financiamento_bancario", valor: numero(form.pagFinanciamento) });
    }
    if (numero(form.pagCrediario) > 0) {
      pagamentos.push({ tipo: "crediario", valor: numero(form.pagCrediario) });
    }
    return pagamentos;
  }

  function confirmar() {
    setErro(null);

    const payload = {
      veiculoId: form.veiculoId,
      clienteId: form.clienteId || undefined,
      clienteNomeAvulso: form.clienteId ? undefined : form.clienteNovoNome || undefined,
      vendedorId: form.vendedorId,
      valorVenda: numero(form.valorVenda),
      desconto: numero(form.desconto),
      comissaoPct: numero(form.comissaoPct),
      garantia: form.garantia || undefined,
      observacoes: form.observacoes || undefined,
      pagamentos: montarPagamentos(),
      crediario:
        numero(form.pagCrediario) > 0 && parcelas.length > 0
          ? {
              taxaJurosMensal: numero(form.crediarioTaxa),
              dataPrimeiroVencimento: form.crediarioPrimeiroVenc,
              parcelas: parcelas.map((p) => ({
                numero: p.numero,
                vencimento: p.vencimento,
                valor: p.valor,
              })),
            }
          : undefined,
    };

    startTransition(async () => {
      const resultado = await fecharVenda(payload);
      if (resultado.error || !resultado.vendaId) {
        setErro(resultado.error ?? "Não foi possível concluir a venda.");
        return;
      }
      router.push("/vendas/realizadas");
    });
  }

  const clienteResumo = clienteSelecionado?.nome || form.clienteNovoNome || "Cliente balcão";
  const veiculoResumo = veiculoSelecionado
    ? `${veiculoSelecionado.marca} ${veiculoSelecionado.modelo} — ${veiculoSelecionado.placa}`
    : "—";
  const temDadosDeCusto =
    veiculoSelecionado != null &&
    "custo_total" in veiculoSelecionado &&
    veiculoSelecionado.custo_total != null;
  const lucro = temDadosDeCusto
    ? total - veiculoSelecionado!.custo_total - total * (numero(form.comissaoPct) / 100)
    : null;

  return (
    <Card>
      <CardContent>
        <Tabs value={etapa} onValueChange={setEtapa}>
          <TabsList className="flex-wrap">
            {ETAPAS.map((e) => (
              <TabsTrigger key={e.id} value={e.id}>
                {e.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="veiculo" className="pt-4">
            <VeiculoStep
              veiculos={veiculos}
              veiculoId={form.veiculoId}
              onSelecionar={selecionarVeiculo}
            />
          </TabsContent>

          <TabsContent value="cliente" className="pt-4">
            <ClienteStep
              clientes={clientes}
              clienteId={form.clienteId}
              clienteNovoNome={form.clienteNovoNome}
              clienteNovoCpf={form.clienteNovoCpf}
              onSelecionar={selecionarCliente}
              onNovoNomeChange={(v) => patch({ clienteNovoNome: v })}
              onNovoCpfChange={(v) => patch({ clienteNovoCpf: v })}
            />
          </TabsContent>

          <TabsContent value="negociacao" className="pt-4">
            <NegociacaoStep
              form={form}
              patch={patch}
              veiculoSelecionado={veiculoSelecionado}
              margemMinimaPctDefault={margemMinimaPctDefault}
            />
          </TabsContent>

          <TabsContent value="pagamento" className="pt-4">
            <PagamentoStep form={form} patch={patch} />
          </TabsContent>

          <TabsContent value="crediario" className="pt-4">
            <CrediarioStep
              form={form}
              patch={patch}
              parcelas={parcelas}
              onGerarParcelas={handleGerarParcelas}
              onEditarParcela={editarParcela}
            />
          </TabsContent>

          <TabsContent value="documentos" className="pt-4">
            <DocumentosStep form={form} patch={patch} vendedores={vendedores} />
          </TabsContent>

          <TabsContent value="confirmacao" className="pt-4">
            <ConfirmacaoStep
              veiculoResumo={veiculoResumo}
              clienteResumo={clienteResumo}
              vendedorNome={vendedorSelecionado?.nome ?? "—"}
              total={total}
              lucro={lucro}
              avisos={avisos}
              garantia={form.garantia}
              onConfirmar={confirmar}
              pending={pending}
              erro={erro}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
