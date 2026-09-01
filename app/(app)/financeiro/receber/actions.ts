"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { getTenantConfig } from "@/lib/data/tenant";
import { createClient } from "@/lib/supabase/server";
import { aplicarBaixaParcela } from "@/lib/data/baixa-parcela";
import {
  resumirBaixaLote,
  type ResultadoBaixaParcela,
  type ResumoBaixaLote,
} from "@/lib/domain/baixa-lote";
import { baixaParcelaSchema, baixaLoteSchema } from "@/lib/validation/baixa-parcela.schema";
import { renegociarContratoSchema } from "@/lib/validation/renegociacao.schema";

export type BaixaParcelaState = {
  error: string | null;
  sucesso: boolean;
};

export type BaixaLoteState = {
  error: string | null;
  resumo: ResumoBaixaLote | null;
};

export type RenegociarContratoResultado = {
  novoContratoId: string | null;
  error: string | null;
};

export async function renegociarContrato(input: unknown): Promise<RenegociarContratoResultado> {
  await requireProfile();

  const parsed = renegociarContratoSchema.safeParse(input);
  if (!parsed.success) {
    return { novoContratoId: null, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("renegociar_contrato", {
    payload: parsed.data,
  });

  if (error) {
    return { novoContratoId: null, error: "Não foi possível renegociar o contrato. " + error.message };
  }

  revalidatePath("/financeiro/receber");
  return { novoContratoId: data, error: null };
}

export async function darBaixaParcela(
  _prevState: BaixaParcelaState,
  formData: FormData,
): Promise<BaixaParcelaState> {
  const profile = await requireProfile();

  const parsed = baixaParcelaSchema.safeParse({
    parcelaId: String(formData.get("parcelaId") ?? ""),
    desconto: Number(String(formData.get("desconto") ?? "0").replace(",", ".")) || 0,
    formaPagamento: String(formData.get("formaPagamento") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", sucesso: false };
  }
  const { parcelaId, desconto, formaPagamento } = parsed.data;

  const supabase = await createClient();

  const { data: parcela, error: parcelaError } = await supabase
    .from("parcelas")
    .select("id, vencimento, valor, status")
    .eq("id", parcelaId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();
  if (parcelaError) {
    return { error: "Não foi possível carregar a parcela. " + parcelaError.message, sucesso: false };
  }
  if (!parcela) {
    return { error: "Parcela não encontrada.", sucesso: false };
  }

  const tenantConfig = await getTenantConfig();
  const erro = await aplicarBaixaParcela(supabase, {
    tenantId: profile.tenantId,
    tenantConfig,
    parcela,
    desconto,
    formaPagamento,
    hoje: new Date(),
  });
  if (erro) {
    return { error: erro, sucesso: false };
  }

  revalidatePath("/financeiro/receber");
  return { error: null, sucesso: true };
}

/**
 * Quantas parcelas do lote são gravadas em paralelo por vez. Serial demoraria
 * (uma ida ao banco por parcela); tudo de uma vez abriria dezenas de conexões
 * simultâneas num "selecionar todas". Em levas o tempo cai sem esse risco.
 */
const TAMANHO_LEVA = 10;

export async function darBaixaParcelasEmLote(
  _prevState: BaixaLoteState,
  formData: FormData,
): Promise<BaixaLoteState> {
  const profile = await requireProfile();

  const parsed = baixaLoteSchema.safeParse({
    parcelaIds: formData.getAll("parcelaIds").map((id) => String(id)),
    formaPagamento: String(formData.get("formaPagamento") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", resumo: null };
  }
  const { parcelaIds, formaPagamento } = parsed.data;

  const supabase = await createClient();

  // Uma consulta só para o lote inteiro. O `tenant_id` aqui (além da RLS)
  // garante que um id forjado no client não alcance parcela de outra revenda:
  // ele simplesmente não volta nesta lista e é reportado como não encontrado.
  const { data: parcelas, error: parcelasError } = await supabase
    .from("parcelas")
    .select("id, vencimento, valor, status")
    .in("id", parcelaIds)
    .eq("tenant_id", profile.tenantId);
  if (parcelasError) {
    return { error: "Não foi possível carregar as parcelas. " + parcelasError.message, resumo: null };
  }

  const porId = new Map((parcelas ?? []).map((p) => [p.id, p]));
  const tenantConfig = await getTenantConfig();
  const hoje = new Date();

  const resultados: ResultadoBaixaParcela[] = [];
  for (let i = 0; i < parcelaIds.length; i += TAMANHO_LEVA) {
    const leva = parcelaIds.slice(i, i + TAMANHO_LEVA);
    const daLeva = await Promise.all(
      leva.map(async (parcelaId): Promise<ResultadoBaixaParcela> => {
        const parcela = porId.get(parcelaId);
        if (!parcela) {
          return { parcelaId, erro: "Parcela não encontrada." };
        }

        const erro = await aplicarBaixaParcela(supabase, {
          tenantId: profile.tenantId,
          tenantConfig,
          parcela,
          desconto: 0,
          formaPagamento,
          hoje,
        });
        return { parcelaId, erro };
      }),
    );
    resultados.push(...daLeva);
  }

  const resumo = resumirBaixaLote(resultados);
  if (resumo.baixadas > 0) {
    revalidatePath("/financeiro/receber");
  }
  return { error: null, resumo };
}
