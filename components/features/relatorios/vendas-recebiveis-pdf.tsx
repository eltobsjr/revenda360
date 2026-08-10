import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBRL, formatDataBR } from "@/lib/format";
import type { ContratoRelatorioLinha } from "@/lib/data/relatorios";
import type { StatusParcela } from "@/lib/domain/juros";

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
  colCliente: { flexBasis: "23%" },
  colVeiculo: { flexBasis: "19%" },
  colValor: { flexBasis: "12%", textAlign: "right" },
  colVencimento: { flexBasis: "13%", textAlign: "right" },
  colSituacao: { flexBasis: "12%", textAlign: "center" },
  colAtrasadas: { flexBasis: "14%", textAlign: "center", color: "#b91c1c" },
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

/** Situação do contrato = da próxima parcela pendente; "Paga" quando não há nenhuma. */
export function situacaoDoContrato(linha: ContratoRelatorioLinha): StatusParcela {
  return linha.proximaParcela?.status ?? "Paga";
}

export function VendasRecebiveisPdf({
  linhas,
  titulo = "Vendas & Recebíveis",
}: {
  linhas: ContratoRelatorioLinha[];
  titulo?: string;
}) {
  const ordenadas = [...linhas].sort((a, b) => {
    const ordemA = SITUACAO_ORDEM[situacaoDoContrato(a)] ?? 2;
    const ordemB = SITUACAO_ORDEM[situacaoDoContrato(b)] ?? 2;
    if (ordemA !== ordemB) return ordemA - ordemB;
    const vencA = a.proximaParcela?.vencimento ?? "9999-12-31";
    const vencB = b.proximaParcela?.vencimento ?? "9999-12-31";
    return vencA.localeCompare(vencB);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>Gerado em {formatDataBR(new Date())}</Text>

        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colCliente]}>Cliente</Text>
          <Text style={[styles.headerCell, styles.colVeiculo]}>Veículo</Text>
          <Text style={[styles.headerCell, styles.colValor]}>Valor</Text>
          <Text style={[styles.headerCell, styles.colVencimento]}>Vencimento</Text>
          <Text style={[styles.headerCell, styles.colSituacao]}>Situação</Text>
          <Text style={[styles.headerCell, styles.colAtrasadas]}>Parcelas atrasadas</Text>
          <Text style={[styles.headerCell, styles.colCheck]}>Caiu na conta</Text>
        </View>

        {ordenadas.map((linha) => (
          <View key={linha.contratoId} style={styles.row} wrap={false}>
            <Text style={styles.colCliente}>{linha.cliente}</Text>
            <Text style={styles.colVeiculo}>{linha.veiculo}</Text>
            <Text style={styles.colValor}>
              {linha.proximaParcela ? formatBRL(linha.proximaParcela.valor) : "—"}
            </Text>
            <Text style={styles.colVencimento}>
              {linha.proximaParcela ? formatDataBR(linha.proximaParcela.vencimento) : "—"}
            </Text>
            <Text style={styles.colSituacao}>{situacaoDoContrato(linha)}</Text>
            <Text style={styles.colAtrasadas}>
              {linha.qtdAtrasadas > 1 ? `${linha.qtdAtrasadas} parcelas` : ""}
            </Text>
            <View style={styles.colCheck}>
              <View style={styles.checkbox} />
            </View>
          </View>
        ))}

        {ordenadas.length === 0 ? (
          <Text style={styles.vazio}>Nenhum contrato de crediário encontrado.</Text>
        ) : null}
      </Page>
    </Document>
  );
}
