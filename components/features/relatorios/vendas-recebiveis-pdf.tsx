import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ParcelaRow } from "@/lib/data/contas-receber";

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
  colCliente: { flexBasis: "24%" },
  colVeiculo: { flexBasis: "20%" },
  colParcela: { flexBasis: "10%", textAlign: "center" },
  colValor: { flexBasis: "13%", textAlign: "right" },
  colVencimento: { flexBasis: "13%", textAlign: "right" },
  colSituacao: { flexBasis: "13%", textAlign: "center" },
  colCheck: { flexBasis: "7%", alignItems: "center" },
  checkbox: { width: 10, height: 10, borderWidth: 1, borderColor: "#333333" },
  vazio: { marginTop: 12, color: "#666666" },
});

/** Mesma ordem de urgência usada no Dashboard: atrasada > a vencer/parcial > paga. */
const SITUACAO_ORDEM: Record<string, number> = {
  Atrasada: 0,
  "A vencer": 1,
  Parcial: 1,
  Paga: 2,
  Renegociada: 2,
};

export function VendasRecebiveisPdf({
  parcelas,
  titulo = "Vendas & Recebíveis",
  periodo,
}: {
  parcelas: ParcelaRow[];
  titulo?: string;
  periodo: { inicio: string; fim: string };
}) {
  const ordenadas = [...parcelas].sort((a, b) => {
    const ordemA = SITUACAO_ORDEM[a.status] ?? 2;
    const ordemB = SITUACAO_ORDEM[b.status] ?? 2;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.vencimento.localeCompare(b.vencimento);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>
          Período: {formatDataBR(periodo.inicio)} a {formatDataBR(periodo.fim)} — Gerado em{" "}
          {formatDataBR(new Date())}
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.headerCell, styles.colVeiculo]}>Veículo</Text>
          <Text style={[styles.headerCell, styles.colParcela]}>Parcela</Text>
          <Text style={[styles.headerCell, styles.colValor]}>Valor</Text>
          <Text style={[styles.headerCell, styles.colVencimento]}>Vencimento</Text>
          <Text style={[styles.headerCell, styles.colSituacao]}>Situação</Text>
          <Text style={[styles.headerCell, styles.colCheck]}>Caiu na conta</Text>
        </View>

        {ordenadas.map((p) => (
          <View key={p.id} style={styles.row} wrap={false}>
            <Text style={styles.colCliente}>{p.cliente}</Text>
            <Text style={styles.colVeiculo}>{p.veiculo}</Text>
            <Text style={styles.colParcela}>
              {p.numero}/{p.totalParcelas}
            </Text>
            <Text style={styles.colValor}>{formatBRL(p.valor)}</Text>
            <Text style={styles.colVencimento}>{formatDataBR(p.vencimento)}</Text>
            <Text style={styles.colSituacao}>{p.status}</Text>
            <View style={styles.colCheck}>
              <View style={styles.checkbox} />
            </View>
          </View>
        ))}

        {ordenadas.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma parcela encontrada nesse período.</Text>
        ) : null}
      </Page>
    </Document>
  );
}
