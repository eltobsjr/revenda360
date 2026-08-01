import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { Switch } from "@/components/ui/switch";
import type { VeiculoFormState } from "./form-state";

type Props = {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
};

function CampoSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function DocumentacaoTab({ form, patch }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CampoSwitch
          label="CRLV em dia"
          checked={form.crlvEmDia}
          onChange={(v) => patch({ crlvEmDia: v })}
        />
        <CampoSwitch
          label="Licenciamento em dia"
          checked={form.licenciamentoEmDia}
          onChange={(v) => patch({ licenciamentoEmDia: v })}
        />
        <CampoSwitch
          label="CRV/DUT em mãos"
          checked={form.crvEmMaos}
          onChange={(v) => patch({ crvEmMaos: v })}
        />
        <CampoSwitch label="ATPV-e" checked={form.atpve} onChange={(v) => patch({ atpve: v })} />
        <CampoSwitch
          label="Chave reserva"
          checked={form.chaveReserva}
          onChange={(v) => patch({ chaveReserva: v })}
        />
        <CampoSwitch
          label="Manual do proprietário"
          checked={form.manualProprietario}
          onChange={(v) => patch({ manualProprietario: v })}
        />
        <CampoSwitch
          label="Histórico de leilão/sinistro"
          checked={form.historicoLeilaoSinistro}
          onChange={(v) => patch({ historicoLeilaoSinistro: v })}
        />
        <CampoSwitch
          label="Gravame/alienação ativo"
          checked={form.gravame}
          onChange={(v) => patch({ gravame: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <FormField label="IPVA" htmlFor="ipvaStatus">
          <NativeSelect
            id="ipvaStatus"
            value={form.ipvaStatus}
            onChange={(e) =>
              patch({ ipvaStatus: e.target.value as VeiculoFormState["ipvaStatus"] })
            }
          >
            <NativeSelectOption value="Pago">Pago</NativeSelectOption>
            <NativeSelectOption value="Pendente">Pendente</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Valor do IPVA" htmlFor="ipvaValor">
          <Input
            id="ipvaValor"
            type="number"
            value={form.ipvaValor}
            onChange={(e) => patch({ ipvaValor: e.target.value })}
          />
        </FormField>
        <FormField label="Ano do IPVA" htmlFor="ipvaAno">
          <Input
            id="ipvaAno"
            type="number"
            value={form.ipvaAno}
            onChange={(e) => patch({ ipvaAno: e.target.value })}
          />
        </FormField>
        <FormField label="Multas em aberto (R$)" htmlFor="multasValor">
          <Input
            id="multasValor"
            type="number"
            value={form.multasValor}
            onChange={(e) => patch({ multasValor: e.target.value })}
          />
        </FormField>
        <FormField label="Financeira do gravame" htmlFor="gravameFinanceira">
          <Input
            id="gravameFinanceira"
            value={form.gravameFinanceira}
            onChange={(e) => patch({ gravameFinanceira: e.target.value })}
            disabled={!form.gravame}
          />
        </FormField>
        <FormField label="Valor de quitação do gravame" htmlFor="gravameValorQuitacao">
          <Input
            id="gravameValorQuitacao"
            type="number"
            value={form.gravameValorQuitacao}
            onChange={(e) => patch({ gravameValorQuitacao: e.target.value })}
            disabled={!form.gravame}
          />
        </FormField>
        <FormField label="Laudo cautelar" htmlFor="laudoCautelar">
          <NativeSelect
            id="laudoCautelar"
            value={form.laudoCautelar}
            onChange={(e) =>
              patch({ laudoCautelar: e.target.value as VeiculoFormState["laudoCautelar"] })
            }
          >
            <NativeSelectOption value="Não feito">Não feito</NativeSelectOption>
            <NativeSelectOption value="Aprovado">Aprovado</NativeSelectOption>
            <NativeSelectOption value="Com apontamento">Com apontamento</NativeSelectOption>
          </NativeSelect>
        </FormField>
      </div>
    </div>
  );
}
