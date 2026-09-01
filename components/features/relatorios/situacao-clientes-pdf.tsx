import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { SituacaoClienteRow } from "@/lib/data/contas-receber";
import type { SituacaoCliente } from "@/lib/domain/situacao-cliente";

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
  colCliente: { flexBasis: "40%" },
  colSituacao: { flexBasis: "30%" },
  colValor: { flexBasis: "30%", textAlign: "right" },
  vazio: { marginTop: 12, color: "#666666" },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: 700,
  },
});

/** Cores aproximadas dos tokens --success/--warning/--destructive usados nos badges do site. */
const SITUACAO_PILL: Record<SituacaoCliente, { backgroundColor: string; color: string }> = {
  "A vencer": { backgroundColor: "#ffffff", color: "#333333" },
  Pago: { backgroundColor: "#dcfce7", color: "#15803d" },
  "Atrasado 1x": { backgroundColor: "#fef3c7", color: "#b45309" },
  "Atrasado 2x": { backgroundColor: "#fee2e2", color: "#dc2626" },
};

const SITUACAO_ORDEM: Record<SituacaoCliente, number> = {
  "Atrasado 2x": 0,
  "Atrasado 1x": 1,
  "A vencer": 2,
  Pago: 3,
};

export function SituacaoClientesPdf({ clientes }: { clientes: SituacaoClienteRow[] }) {
  const ordenados = [...clientes].sort((a, b) => {
    const ordemA = SITUACAO_ORDEM[a.situacao];
    const ordemB = SITUACAO_ORDEM[b.situacao];
    if (ordemA !== ordemB) return ordemA - ordemB;
    return b.valorPendente - a.valorPendente;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Situação dos clientes</Text>
        <Text style={styles.subtitle}>Gerado em {formatDataBR(new Date())}</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.headerCell, styles.colSituacao]}>Situação</Text>
          <Text style={[styles.headerCell, styles.colValor]}>Valor pendente</Text>
        </View>

        {ordenados.map((c) => (
          <View key={c.clienteChave} style={styles.row} wrap={false}>
            <Text style={styles.colCliente}>{c.cliente}</Text>
            <View style={styles.colSituacao}>
              <Text style={[styles.pill, SITUACAO_PILL[c.situacao]]}>{c.situacao}</Text>
            </View>
            <Text style={styles.colValor}>{formatBRL(c.valorPendente)}</Text>
          </View>
        ))}

        {ordenados.length === 0 ? (
          <Text style={styles.vazio}>Nenhum cliente com contrato de crediário ativo.</Text>
        ) : null}
      </Page>
    </Document>
  );
}
