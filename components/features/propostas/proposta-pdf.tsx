import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { PropostaRow } from "@/lib/data/propostas";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#666666", marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 6,
  },
  label: { color: "#666666" },
  value: { fontWeight: 700 },
  condicoes: { marginTop: 20 },
  condicoesTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
});

export function PropostaPdf({ proposta }: { proposta: PropostaRow }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Proposta de Venda</Text>
        <Text style={styles.subtitle}>Gerado em {formatDataBR(new Date())}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Veículo</Text>
          <Text style={styles.value}>
            {proposta.veiculo} ({proposta.placa})
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{proposta.cliente}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Valor proposto</Text>
          <Text style={styles.value}>{formatBRL(proposta.valorProposto)}</Text>
        </View>
        {proposta.validade ? (
          <View style={styles.row}>
            <Text style={styles.label}>Validade</Text>
            <Text style={styles.value}>{formatDataBR(proposta.validade)}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Vendedor</Text>
          <Text style={styles.value}>{proposta.vendedor}</Text>
        </View>

        {proposta.condicoes ? (
          <View style={styles.condicoes}>
            <Text style={styles.condicoesTitle}>Condições</Text>
            <Text>{proposta.condicoes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
