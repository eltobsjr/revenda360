"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import {
  veiculoFormSchema,
  parseEspecificacoes,
  type VeiculoFormInput,
} from "@/lib/validation/veiculo.schema";
import type { Database } from "@/types/database.types";

export type SalvarVeiculoResultado = {
  error: string | null;
  veiculoId: string | null;
};

type VeiculoInsert = Database["public"]["Tables"]["veiculos"]["Insert"];

function formParaLinhaBanco(
  form: VeiculoFormInput,
  especificacoes: Record<string, unknown>,
  tenantId: string,
  lojaId: string | null,
  isGestor: boolean,
): Omit<VeiculoInsert, "id"> {
  return {
    tenant_id: tenantId,
    loja_id: form.lojaId || lojaId,
    tipo: form.tipo,
    placa: form.placa.toUpperCase(),
    renavam: form.renavam || null,
    chassi: form.chassi || null,
    numero_motor: form.numeroMotor || null,
    uf_emplacamento: form.ufEmplacamento || null,
    municipio_emplacamento: form.municipioEmplacamento || null,
    marca: form.marca,
    modelo: form.modelo,
    versao: form.versao || null,
    ano_fab: form.anoFab ?? null,
    ano_mod: form.anoMod ?? null,
    cor: form.cor || null,
    combustivel: form.combustivel || null,
    km: form.km,
    procedencia: form.procedencia,
    categoria: form.categoria,
    proprietarios_anteriores: form.proprietariosAnteriores,

    crlv_em_dia: form.crlvEmDia,
    ipva_status: form.ipvaStatus,
    ipva_valor: form.ipvaValor ?? null,
    ipva_ano: form.ipvaAno ?? null,
    licenciamento_em_dia: form.licenciamentoEmDia,
    multas_valor: form.multasValor,
    gravame: form.gravame,
    gravame_financeira: form.gravameFinanceira || null,
    gravame_valor_quitacao: form.gravameValorQuitacao ?? null,
    crv_em_maos: form.crvEmMaos,
    atpve: form.atpve,
    laudo_cautelar: form.laudoCautelar,
    historico_leilao_sinistro: form.historicoLeilaoSinistro,
    chave_reserva: form.chaveReserva,
    manual_proprietario: form.manualProprietario,

    data_entrada: form.dataEntrada,
    origem: form.origem,
    fornecedor: form.fornecedor || null,
    valor_compra: form.valorCompra,
    forma_pag_compra: form.formaPagCompra || null,

    valor_fipe: form.valorFipe ?? null,
    preco_venda: form.precoVenda,
    preco_financiamento: form.precoFinanciamento ?? null,
    preco_minimo: isGestor ? (form.precoMinimo ?? null) : null,

    descricao_anuncio: form.descricaoAnuncio || null,
    portais_publicar: form.portaisPublicar,
    observacoes: form.observacoes || null,

    especificacoes,
  };
}

export async function salvarVeiculo(input: {
  veiculoId?: string;
  form: VeiculoFormInput;
  especificacoesRaw: unknown;
  /** Só usado na criação (Fase 9, Avaliação/Troca) — liga o veículo novo de volta ao pagamento tipo "troca" que o originou. */
  origemTrocaPagamentoId?: string;
}): Promise<SalvarVeiculoResultado> {
  const profile = await requireProfile();

  const parsed = veiculoFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", veiculoId: null };
  }

  let especificacoes: Record<string, unknown>;
  try {
    especificacoes = parseEspecificacoes(parsed.data.tipo, input.especificacoesRaw);
  } catch {
    return { error: "Especificações inválidas para o tipo selecionado.", veiculoId: null };
  }

  const linha = formParaLinhaBanco(
    parsed.data,
    especificacoes,
    profile.tenantId,
    profile.lojaId,
    profile.role === "gestor",
  );

  const supabase = await createClient();
  let veiculoId = input.veiculoId ?? null;

  if (veiculoId) {
    // Fora do papel de gestor, valor de compra e preço mínimo não chegam ao
    // formulário (`ocultarCamposSensiveis`) — regravá-los aqui zeraria o custo
    // de aquisição e apagaria o preço mínimo definido pelo gestor. Na criação
    // eles seguem normalmente: o valor de compra é digitado na própria entrada.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- descartados de propósito
    const { valor_compra: _valorCompra, preco_minimo: _precoMinimo, ...linhaSemSensiveis } = linha;
    const alteracoes = profile.role === "gestor" ? linha : linhaSemSensiveis;

    const { error } = await supabase
      .from("veiculos")
      .update({ ...alteracoes, atualizado_em: new Date().toISOString() })
      .eq("id", veiculoId);
    if (error) {
      return { error: `Não foi possível salvar o veículo: ${error.message}`, veiculoId: null };
    }
  } else {
    // Só inclui a coluna no INSERT quando realmente usada (Fase 9, Avaliação/
    // Troca) — ela é nova (migration 0008) e pode ainda não existir no banco
    // de quem não aplicou a migration ainda; incluí-la sempre (mesmo com
    // null) quebraria a Entrada de veículo normal (Fase 2) até lá.
    const { data, error } = await supabase
      .from("veiculos")
      .insert(
        input.origemTrocaPagamentoId
          ? { ...linha, origem_troca_pagamento_id: input.origemTrocaPagamentoId }
          : linha,
      )
      .select("id")
      .single();
    if (error || !data) {
      return {
        error: `Não foi possível cadastrar o veículo: ${error?.message}`,
        veiculoId: null,
      };
    }
    veiculoId = data.id;
  }

  const { error: delCustosError } = await supabase
    .from("custos_veiculo")
    .delete()
    .eq("veiculo_id", veiculoId);
  if (delCustosError) {
    return {
      error: `Veículo salvo, mas houve falha ao atualizar os custos: ${delCustosError.message}`,
      veiculoId,
    };
  }

  if (parsed.data.custos.length > 0) {
    const { error: custosError } = await supabase.from("custos_veiculo").insert(
      parsed.data.custos.map((c) => ({
        tenant_id: profile.tenantId,
        veiculo_id: veiculoId!,
        categoria: c.categoria,
        descricao: c.descricao || null,
        fornecedor: c.fornecedor || null,
        valor: c.valor,
        data: c.data,
      })),
    );
    if (custosError) {
      return {
        error: `Veículo salvo, mas houve falha ao lançar os custos: ${custosError.message}`,
        veiculoId,
      };
    }
  }

  revalidatePath("/estoque");
  revalidatePath(`/estoque/${veiculoId}`);
  if (input.origemTrocaPagamentoId) revalidatePath("/estoque/avaliacao-troca");

  return { error: null, veiculoId };
}

export async function salvarFotoVeiculo(input: {
  veiculoId: string;
  storagePath: string;
  ordem: number;
  capa: boolean;
}): Promise<{ error: string | null }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (input.capa) {
    await supabase
      .from("veiculo_fotos")
      .update({ capa: false })
      .eq("veiculo_id", input.veiculoId);
  }

  const { error } = await supabase.from("veiculo_fotos").insert({
    tenant_id: profile.tenantId,
    veiculo_id: input.veiculoId,
    storage_path: input.storagePath,
    ordem: input.ordem,
    capa: input.capa,
  });

  if (error) return { error: error.message };
  revalidatePath(`/estoque/${input.veiculoId}`);
  return { error: null };
}

export async function removerFotoVeiculo(input: {
  fotoId: string;
  storagePath: string;
  veiculoId: string;
}): Promise<{ error: string | null }> {
  await requireProfile();
  const supabase = await createClient();

  await supabase.storage.from("veiculo-fotos").remove([input.storagePath]);

  const { error } = await supabase.from("veiculo_fotos").delete().eq("id", input.fotoId);
  if (error) return { error: error.message };

  revalidatePath(`/estoque/${input.veiculoId}`);
  return { error: null };
}

export async function criarUrlAssinadaFoto(storagePath: string): Promise<string | null> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("veiculo-fotos")
    .createSignedUrl(storagePath, 60 * 60);
  return data?.signedUrl ?? null;
}
