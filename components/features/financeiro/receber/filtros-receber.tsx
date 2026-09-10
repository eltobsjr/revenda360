"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { FiltroAtraso, FiltroVencimento } from "@/lib/domain/filtros-receber";

/**
 * Barra de filtros compartilhada pelas três visões de Contas a receber.
 *
 * Filtra no client, e não por `searchParams`: os dados já chegam inteiros na
 * tabela, então a busca responde a cada tecla, sem ida ao servidor. Antes
 * havia um form server-side só com status, com botão "Filtrar" e recarga de
 * página a cada troca.
 *
 * Cada visão liga só os controles que fazem sentido no seu eixo — as opções de
 * situação são passadas de fora porque "situação" significa coisas diferentes
 * em parcela, contrato e cliente.
 */
export type CriteriosReceber = {
  busca: string;
  situacao: string;
  vencimento: FiltroVencimento;
  atraso: FiltroAtraso;
};

export const CRITERIOS_VAZIOS: CriteriosReceber = {
  busca: "",
  situacao: "todos",
  vencimento: "todos",
  atraso: "todos",
};

export function temFiltroAtivo(c: CriteriosReceber): boolean {
  return (
    c.busca.trim() !== "" ||
    c.situacao !== "todos" ||
    c.vencimento !== "todos" ||
    c.atraso !== "todos"
  );
}

const OPCOES_VENCIMENTO: { valor: FiltroVencimento; rotulo: string }[] = [
  { valor: "todos", rotulo: "Vencimento: todos" },
  { valor: "vencidas", rotulo: "Já vencidas" },
  { valor: "este-mes", rotulo: "Vence este mês" },
  { valor: "proximos-30", rotulo: "Próximos 30 dias" },
  { valor: "futuras", rotulo: "Ainda a vencer" },
];

const OPCOES_ATRASO: { valor: FiltroAtraso; rotulo: string }[] = [
  { valor: "todos", rotulo: "Atraso: qualquer" },
  { valor: "1-30", rotulo: "1 a 30 dias" },
  { valor: "31-60", rotulo: "31 a 60 dias" },
  { valor: "61-90", rotulo: "61 a 90 dias" },
  { valor: "90+", rotulo: "Mais de 90 dias" },
];

export function FiltrosReceber({
  criterios,
  onChange,
  situacoes,
  rotuloSituacao,
  comVencimento = false,
  comAtraso = false,
  totalFiltrado,
  total,
  unidade,
}: {
  criterios: CriteriosReceber;
  onChange: (c: CriteriosReceber) => void;
  /** Opções do filtro de situação; omitir esconde o controle. */
  situacoes?: string[];
  rotuloSituacao?: string;
  comVencimento?: boolean;
  comAtraso?: boolean;
  totalFiltrado: number;
  total: number;
  /** Como chamar as linhas no contador — "parcela", "contrato", "cliente". */
  unidade: string;
}) {
  const alterar = (mudanca: Partial<CriteriosReceber>) =>
    onChange({ ...criterios, ...mudanca });

  const filtrando = temFiltroAtivo(criterios);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Buscar cliente ou veículo"
          placeholder="Buscar cliente ou veículo…"
          value={criterios.busca}
          onChange={(e) => alterar({ busca: e.target.value })}
          className="w-full sm:w-64"
        />

        {situacoes ? (
          <NativeSelect
            aria-label={rotuloSituacao ?? "Situação"}
            value={criterios.situacao}
            onChange={(e) => alterar({ situacao: e.target.value })}
            className="w-full sm:w-44"
          >
            <NativeSelectOption value="todos">
              {rotuloSituacao ?? "Situação"}: todas
            </NativeSelectOption>
            {situacoes.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}

        {comVencimento ? (
          <NativeSelect
            aria-label="Vencimento"
            value={criterios.vencimento}
            onChange={(e) => alterar({ vencimento: e.target.value as FiltroVencimento })}
            className="w-full sm:w-44"
          >
            {OPCOES_VENCIMENTO.map((o) => (
              <NativeSelectOption key={o.valor} value={o.valor}>
                {o.rotulo}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}

        {comAtraso ? (
          <NativeSelect
            aria-label="Faixa de atraso"
            value={criterios.atraso}
            onChange={(e) => alterar({ atraso: e.target.value as FiltroAtraso })}
            className="w-full sm:w-44"
          >
            {OPCOES_ATRASO.map((o) => (
              <NativeSelectOption key={o.valor} value={o.valor}>
                {o.rotulo}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}

        {filtrando ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(CRITERIOS_VAZIOS)}>
            Limpar filtros
          </Button>
        ) : null}
      </div>

      {filtrando ? (
        <p className="text-xs text-muted-foreground">
          {totalFiltrado} de {total} {total === 1 ? unidade : unidade + "s"}
        </p>
      ) : null}
    </div>
  );
}
