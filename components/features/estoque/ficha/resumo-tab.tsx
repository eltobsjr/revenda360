import { parseEspecificacoes } from "@/lib/validation/veiculo.schema";
import { formatBRL, formatInt } from "@/lib/format";
import type { VeiculoDetalhe } from "@/lib/data/veiculos";

function CampoTexto({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{valor ?? "—"}</p>
    </div>
  );
}

export function ResumoTab({ veiculo }: { veiculo: VeiculoDetalhe }) {
  const especificacoes = parseEspecificacoes(veiculo.tipo, veiculo.especificacoes);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <CampoTexto label="Marca" valor={veiculo.marca} />
        <CampoTexto label="Modelo" valor={veiculo.modelo} />
        <CampoTexto label="Versão" valor={veiculo.versao} />
        <CampoTexto label="Ano fab/mod" valor={`${veiculo.ano_fab ?? "—"}/${veiculo.ano_mod ?? "—"}`} />
        <CampoTexto label="Placa" valor={veiculo.placa} />
        <CampoTexto label="Cor" valor={veiculo.cor} />
        <CampoTexto label="KM" valor={formatInt(veiculo.km)} />
        <CampoTexto label="Combustível" valor={veiculo.combustivel} />
        <CampoTexto
          label="Procedência"
          valor={veiculo.procedencia === "importado" ? "Importado" : "Nacional"}
        />
        <CampoTexto
          label="Categoria"
          valor={veiculo.categoria === "aluguel" ? "Aluguel" : "Particular"}
        />
        <CampoTexto label="Proprietários anteriores" valor={veiculo.proprietarios_anteriores} />
        <CampoTexto label="Dias em estoque" valor={veiculo.dias_estoque} />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {veiculo.tipo === "carro" ? "Especificações do carro" : "Especificações da moto"}
        </p>
        {veiculo.tipo === "carro" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <CampoTexto label="Câmbio" valor={"cambio" in especificacoes ? especificacoes.cambio : undefined} />
            <CampoTexto label="Carroceria" valor={"carroceria" in especificacoes ? especificacoes.carroceria : undefined} />
            <CampoTexto label="Portas" valor={"portas" in especificacoes ? especificacoes.portas : undefined} />
            <CampoTexto label="Motorização" valor={"motorizacao" in especificacoes ? especificacoes.motorizacao : undefined} />
            <CampoTexto label="Tração" valor={"tracao" in especificacoes ? especificacoes.tracao : undefined} />
            <CampoTexto
              label="Blindado"
              valor={"blindado" in especificacoes && especificacoes.blindado ? "Sim" : "Não"}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <CampoTexto label="Cilindrada" valor={"cilindradaCc" in especificacoes ? `${especificacoes.cilindradaCc} cc` : undefined} />
            <CampoTexto label="Tipo" valor={"tipo" in especificacoes ? especificacoes.tipo : undefined} />
            <CampoTexto label="Partida" valor={"partida" in especificacoes ? especificacoes.partida : undefined} />
            <CampoTexto label="Refrigeração" valor={"refrigeracao" in especificacoes ? especificacoes.refrigeracao : undefined} />
            <CampoTexto label="Sistema de freio" valor={"sistemaFreio" in especificacoes ? especificacoes.sistemaFreio : undefined} />
            <CampoTexto label="Tipo de roda" valor={"tipoRoda" in especificacoes ? especificacoes.tipoRoda : undefined} />
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preço
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <CampoTexto label="Preço à vista" valor={formatBRL(veiculo.preco_venda)} />
          <CampoTexto
            label="Preço no financiamento"
            valor={veiculo.preco_financiamento != null ? formatBRL(veiculo.preco_financiamento) : null}
          />
          <CampoTexto
            label="Valor FIPE"
            valor={veiculo.valor_fipe != null ? formatBRL(veiculo.valor_fipe) : null}
          />
        </div>
      </div>
    </div>
  );
}
