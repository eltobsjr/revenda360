import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database.types";

export type TrocaPendente = {
  pagamentoId: string;
  descricao: string;
  valor: number | null;
  dataVenda: string;
  veiculoVendido: string;
  cliente: string;
};

/**
 * Pagamentos tipo "troca" (Fase 4, Nova venda) que ainda não viraram um
 * veículo no estoque — nenhum `veiculos.origem_troca_pagamento_id` aponta
 * pra eles ainda. `valor` (custo de aquisição do veículo recebido) só vai
 * pra quem tem role "gestor" (regra suprema do CLAUDE.md: valor de compra é
 * sempre sensível). `role` é obrigatório — achado da auditoria de
 * 2026-08-10: `getTrocaPendente` chamava isto sem `role` (parâmetro
 * opcional, sem esse argumento a checagem `role &amp;&amp; role !== "gestor"`
 * dava falso e devolvia o valor bruto), vazando o valor em texto puro na
 * tela de completar cadastro pra qualquer papel.
 */
export async function listTrocasPendentes(role: UserRole): Promise<TrocaPendente[]> {
  const supabase = await createClient();

  const { data: pagamentos, error } = await supabase
    .from("venda_pagamentos")
    .select("id, venda_id, valor, detalhes")
    .eq("tipo", "troca");
  if (error) throw new Error(`Falha ao listar trocas: ${error.message}`);
  if (!pagamentos || pagamentos.length === 0) return [];

  const { data: veiculosComOrigem, error: origemError } = await supabase
    .from("veiculos")
    .select("origem_troca_pagamento_id")
    .not("origem_troca_pagamento_id", "is", null);
  if (origemError) {
    throw new Error(`Falha ao checar veículos já cadastrados a partir de troca: ${origemError.message}`);
  }

  const jaCadastrados = new Set(
    (veiculosComOrigem ?? []).map((v) => v.origem_troca_pagamento_id),
  );
  const pendentes = pagamentos.filter((p) => !jaCadastrados.has(p.id));
  if (pendentes.length === 0) return [];

  const vendaIds = [...new Set(pendentes.map((p) => p.venda_id))];
  const { data: vendas, error: vendasError } = await supabase
    .from("vendas")
    .select("id, veiculo_id, cliente_id, cliente_nome_avulso, data_venda")
    .in("id", vendaIds);
  if (vendasError) throw new Error(`Falha ao resolver vendas das trocas: ${vendasError.message}`);

  const vendaPorId = new Map((vendas ?? []).map((v) => [v.id, v]));
  const veiculoIds = [...new Set((vendas ?? []).map((v) => v.veiculo_id))];
  const clienteIds = [
    ...new Set((vendas ?? []).map((v) => v.cliente_id).filter((id): id is string => !!id)),
  ];

  const [veiculosRes, clientesRes] = await Promise.all([
    veiculoIds.length
      ? supabase.from("veiculos").select("id, marca, modelo").in("id", veiculoIds)
      : Promise.resolve({ data: [] as { id: string; marca: string; modelo: string }[], error: null }),
    clienteIds.length
      ? supabase.from("clientes").select("id, nome").in("id", clienteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
  ]);
  if (veiculosRes.error) throw new Error(`Falha ao resolver veículos vendidos: ${veiculosRes.error.message}`);
  if (clientesRes.error) throw new Error(`Falha ao resolver clientes: ${clientesRes.error.message}`);

  const veiculoPorId = new Map((veiculosRes.data ?? []).map((v) => [v.id, `${v.marca} ${v.modelo}`]));
  const clientePorId = new Map((clientesRes.data ?? []).map((c) => [c.id, c.nome]));

  return pendentes
    .map((p) => {
      const venda = vendaPorId.get(p.venda_id);
      const detalhes = p.detalhes as { descricao?: string } | null;
      return {
        pagamentoId: p.id,
        descricao: detalhes?.descricao || "Veículo recebido na troca",
        valor: role !== "gestor" ? null : p.valor,
        dataVenda: venda?.data_venda ?? "",
        veiculoVendido: venda ? (veiculoPorId.get(venda.veiculo_id) ?? "Veículo") : "Veículo",
        cliente: venda
          ? venda.cliente_id
            ? (clientePorId.get(venda.cliente_id) ?? "Cliente")
            : (venda.cliente_nome_avulso ?? "Cliente balcão")
          : "Cliente",
      };
    })
    .sort((a, b) => (a.dataVenda < b.dataVenda ? 1 : a.dataVenda > b.dataVenda ? -1 : 0));
}

/** Uma troca pendente específica, para preencher o formulário de completar cadastro. */
export async function getTrocaPendente(pagamentoId: string, role: UserRole): Promise<TrocaPendente | null> {
  const pendentes = await listTrocasPendentes(role);
  return pendentes.find((p) => p.pagamentoId === pagamentoId) ?? null;
}
