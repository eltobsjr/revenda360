import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ContaPagarRow } from "@/lib/data/contas-pagar";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2, fontWeight: 700 },
  subtitle: { fontSize: 9, color: "#666666", marginBottom: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 4,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 6,
  },
  headerCell: { fontWeight: 700, fontSize: 8, color: "#333333" },
  colDescricao: { flexBasis: "24%" },
  colCategoria: { flexBasis: "16%" },
  colFornecedor: { flexBasis: "18%" },
  colValor: { flexBasis: "13%", textAlign: "right" },
  colVencimento: { flexBasis: "13%", textAlign: "right" },
  colSituacao: { flexBasis: "10%", textAlign: "center" },
  colCheck: { flexBasis: "6%", alignItems: "center" },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: "#333333" },
  vazio: { marginTop: 12, color: "#666666" },
});

/** Mesma ordem de urgência usada no relatório de Vendas & Recebíveis. */
const SITUACAO_ORDEM: Record<string, number> = {
  Atrasada: 0,
  "A vencer": 1,
  Parcial: 1,
  Paga: 2,
  Renegociada: 2,
};

export function ContasPagarPdf({ contas }: { contas: ContaPagarRow[] }) {
  const ordenadas = [...contas].sort((a, b) => {
    const ordemA = SITUACAO_ORDEM[a.status] ?? 2;
    const ordemB = SITUACAO_ORDEM[b.status] ?? 2;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.vencimento.localeCompare(b.vencimento);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Contas a pagar</Text>
        <Text style={styles.subtitle}>Gerado em {formatDataBR(new Date())}</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colDescricao]}>Descrição</Text>
          <Text style={[styles.headerCell, styles.colCategoria]}>Categoria</Text>
          <Text style={[styles.headerCell, styles.colFornecedor]}>Fornecedor</Text>
          <Text style={[styles.headerCell, styles.colValor]}>Valor</Text>
          <Text style={[styles.headerCell, styles.colVencimento]}>Vencimento</Text>
          <Text style={[styles.headerCell, styles.colSituacao]}>Situação</Text>
          <Text style={[styles.headerCell, styles.colCheck]}>Pago</Text>
        </View>

        {ordenadas.map((c) => (
          <View key={c.id} style={styles.row} wrap={false}>
            <Text style={styles.colDescricao}>{c.descricao}</Text>
            <Text style={styles.colCategoria}>{c.categoria ?? "—"}</Text>
            <Text style={styles.colFornecedor}>{c.fornecedor ?? "—"}</Text>
            <Text style={styles.colValor}>{formatBRL(c.valor)}</Text>
            <Text style={styles.colVencimento}>{formatDataBR(c.vencimento)}</Text>
            <Text style={styles.colSituacao}>{c.status}</Text>
            <View style={styles.colCheck}>
              <View style={styles.checkbox} />
            </View>
          </View>
        ))}

        {ordenadas.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma conta a pagar registrada.</Text>
        ) : null}
      </Page>
    </Document>
  );
}
