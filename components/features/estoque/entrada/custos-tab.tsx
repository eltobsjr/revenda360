import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { CATEGORIAS_CUSTO } from "@/lib/validation/veiculo.schema";
import { formatBRL } from "@/lib/format";
import { numero, type VeiculoFormState } from "./form-state";

export function CustosTab({
  form,
  patch,
}: {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
}) {
  const total = form.custos.reduce((sum, c) => sum + numero(c.valor), 0);

  function atualizarLinha(index: number, campo: Partial<VeiculoFormState["custos"][number]>) {
    patch({
      custos: form.custos.map((c, i) => (i === index ? { ...c, ...campo } : c)),
    });
  }

  function removerLinha(index: number) {
    patch({ custos: form.custos.filter((_, i) => i !== index) });
  }

  function adicionarLinha() {
    patch({
      custos: [
        ...form.custos,
        {
          categoria: "Outros",
          descricao: "",
          fornecedor: "",
          valor: "",
          data: form.dataEntrada,
        },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {form.custos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum custo lançado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {form.custos.map((custo, i) => (
            <div key={i} className="grid grid-cols-2 items-end gap-3 rounded-md border p-3 sm:grid-cols-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <NativeSelect
                  value={custo.categoria}
                  onChange={(e) =>
                    atualizarLinha(i, {
                      categoria: e.target.value as VeiculoFormState["custos"][number]["categoria"],
                    })
                  }
                >
                  {CATEGORIAS_CUSTO.map((c) => (
                    <NativeSelectOption key={c} value={c}>
                      {c}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <Input
                  value={custo.descricao}
                  onChange={(e) => atualizarLinha(i, { descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fornecedor</label>
                <Input
                  value={custo.fornecedor}
                  onChange={(e) => atualizarLinha(i, { fornecedor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Valor</label>
                <Input
                  type="number"
                  value={custo.valor}
                  onChange={(e) => atualizarLinha(i, { valor: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Data</label>
                  <Input
                    type="date"
                    value={custo.data}
                    onChange={(e) => atualizarLinha(i, { data: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover custo"
                  onClick={() => removerLinha(i)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={adicionarLinha}>
          <Plus />
          Adicionar custo
        </Button>
        <p className="text-sm">
          Total de custos: <span className="tabular-nums font-semibold">{formatBRL(total)}</span>
        </p>
      </div>
    </div>
  );
}
