import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FormField } from "@/components/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { MarcaModeloSelect } from "./marca-modelo-select";
import { OPCIONAIS_CARRO, ACESSORIOS_MOTO } from "@/lib/validation/veiculo.schema";
import type { VeiculoFormState } from "./form-state";
import type { MarcaComModelos } from "@/lib/data/marcas-modelos";

type Props = {
  form: VeiculoFormState;
  patch: (p: Partial<VeiculoFormState>) => void;
  marcas: MarcaComModelos[];
};

export function IdentificacaoTab({ form, patch, marcas }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <FormField label="Placa" htmlFor="placa">
          <Input
            id="placa"
            value={form.placa}
            onChange={(e) => patch({ placa: e.target.value.toUpperCase() })}
            placeholder="ABC1D23"
            maxLength={7}
            required
          />
        </FormField>
        <FormField label="Renavam" htmlFor="renavam">
          <Input
            id="renavam"
            value={form.renavam}
            onChange={(e) => patch({ renavam: e.target.value })}
          />
        </FormField>
        <FormField label="Chassi (VIN)" htmlFor="chassi">
          <Input
            id="chassi"
            value={form.chassi}
            onChange={(e) => patch({ chassi: e.target.value.toUpperCase() })}
            maxLength={17}
          />
        </FormField>
        <FormField label="Nº do motor" htmlFor="numeroMotor">
          <Input
            id="numeroMotor"
            value={form.numeroMotor}
            onChange={(e) => patch({ numeroMotor: e.target.value })}
          />
        </FormField>
        <MarcaModeloSelect
          marcas={marcas}
          onMarcaChange={(nome) => patch({ marca: nome || form.marca })}
          onModeloChange={(nome) => patch({ modelo: nome || form.modelo })}
        />
        <FormField label="Marca" htmlFor="marca">
          <Input
            id="marca"
            value={form.marca}
            onChange={(e) => patch({ marca: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Modelo" htmlFor="modelo">
          <Input
            id="modelo"
            value={form.modelo}
            onChange={(e) => patch({ modelo: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Versão/complemento" htmlFor="versao">
          <Input
            id="versao"
            value={form.versao}
            onChange={(e) => patch({ versao: e.target.value })}
          />
        </FormField>
        <FormField label="Ano de fabricação" htmlFor="anoFab">
          <Input
            id="anoFab"
            type="number"
            value={form.anoFab}
            onChange={(e) => patch({ anoFab: e.target.value })}
          />
        </FormField>
        <FormField label="Ano do modelo" htmlFor="anoMod">
          <Input
            id="anoMod"
            type="number"
            value={form.anoMod}
            onChange={(e) => patch({ anoMod: e.target.value })}
          />
        </FormField>
        <FormField label="Cor" htmlFor="cor">
          <Input id="cor" value={form.cor} onChange={(e) => patch({ cor: e.target.value })} />
        </FormField>
        <FormField label="Combustível" htmlFor="combustivel">
          <Input
            id="combustivel"
            value={form.combustivel}
            onChange={(e) => patch({ combustivel: e.target.value })}
            placeholder="Flex, gasolina..."
          />
        </FormField>
        <FormField label="KM atual" htmlFor="km">
          <Input
            id="km"
            type="number"
            value={form.km}
            onChange={(e) => patch({ km: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Procedência" htmlFor="procedencia">
          <NativeSelect
            id="procedencia"
            value={form.procedencia}
            onChange={(e) =>
              patch({ procedencia: e.target.value as VeiculoFormState["procedencia"] })
            }
          >
            <NativeSelectOption value="nacional">Nacional</NativeSelectOption>
            <NativeSelectOption value="importado">Importado</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Categoria" htmlFor="categoria">
          <NativeSelect
            id="categoria"
            value={form.categoria}
            onChange={(e) =>
              patch({ categoria: e.target.value as VeiculoFormState["categoria"] })
            }
          >
            <NativeSelectOption value="particular">Particular</NativeSelectOption>
            <NativeSelectOption value="aluguel">Aluguel</NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField label="Nº de proprietários anteriores" htmlFor="proprietariosAnteriores">
          <Input
            id="proprietariosAnteriores"
            type="number"
            value={form.proprietariosAnteriores}
            onChange={(e) => patch({ proprietariosAnteriores: e.target.value })}
          />
        </FormField>
        <FormField label="UF de emplacamento" htmlFor="ufEmplacamento">
          <Input
            id="ufEmplacamento"
            value={form.ufEmplacamento}
            onChange={(e) => patch({ ufEmplacamento: e.target.value.toUpperCase() })}
            maxLength={2}
          />
        </FormField>
        <FormField label="Município de emplacamento" htmlFor="municipioEmplacamento">
          <Input
            id="municipioEmplacamento"
            value={form.municipioEmplacamento}
            onChange={(e) => patch({ municipioEmplacamento: e.target.value })}
          />
        </FormField>
      </div>

      {form.tipo === "carro" ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Especificações do carro
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <FormField label="Câmbio" htmlFor="cambio">
              <NativeSelect
                id="cambio"
                value={form.especCarro.cambio}
                onChange={(e) =>
                  patch({
                    especCarro: {
                      ...form.especCarro,
                      cambio: e.target.value as typeof form.especCarro.cambio,
                    },
                  })
                }
              >
                <NativeSelectOption value="Manual">Manual</NativeSelectOption>
                <NativeSelectOption value="Automático">Automático</NativeSelectOption>
                <NativeSelectOption value="CVT">CVT</NativeSelectOption>
                <NativeSelectOption value="Automatizado">Automatizado</NativeSelectOption>
                <NativeSelectOption value="Dupla embreagem">Dupla embreagem</NativeSelectOption>
              </NativeSelect>
            </FormField>
            <FormField label="Motorização" htmlFor="motorizacao">
              <Input
                id="motorizacao"
                value={form.especCarro.motorizacao}
                onChange={(e) =>
                  patch({ especCarro: { ...form.especCarro, motorizacao: e.target.value } })
                }
                placeholder="1.0, 1.6, 2.0..."
              />
            </FormField>
            <FormField label="Potência (cv)" htmlFor="potenciaCv">
              <Input
                id="potenciaCv"
                type="number"
                value={form.especCarro.potenciaCv}
                onChange={(e) =>
                  patch({ especCarro: { ...form.especCarro, potenciaCv: e.target.value } })
                }
              />
            </FormField>
            <FormField label="Nº de portas" htmlFor="portas">
              <Input
                id="portas"
                type="number"
                value={form.especCarro.portas}
                onChange={(e) =>
                  patch({ especCarro: { ...form.especCarro, portas: e.target.value } })
                }
              />
            </FormField>
            <FormField label="Carroceria" htmlFor="carroceria">
              <NativeSelect
                id="carroceria"
                value={form.especCarro.carroceria}
                onChange={(e) =>
                  patch({
                    especCarro: {
                      ...form.especCarro,
                      carroceria: e.target.value as typeof form.especCarro.carroceria,
                    },
                  })
                }
              >
                {["Hatch", "Sedã", "SUV", "Picape", "Minivan", "Station wagon"].map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Tração" htmlFor="tracao">
              <NativeSelect
                id="tracao"
                value={form.especCarro.tracao}
                onChange={(e) =>
                  patch({
                    especCarro: {
                      ...form.especCarro,
                      tracao: e.target.value as typeof form.especCarro.tracao,
                    },
                  })
                }
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                <NativeSelectOption value="Dianteira">Dianteira</NativeSelectOption>
                <NativeSelectOption value="Traseira">Traseira</NativeSelectOption>
                <NativeSelectOption value="4x4/AWD">4x4/AWD</NativeSelectOption>
              </NativeSelect>
            </FormField>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Opcionais</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {OPCIONAIS_CARRO.map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.especCarro.opcionais.includes(op)}
                    onCheckedChange={(checked) =>
                      patch({
                        especCarro: {
                          ...form.especCarro,
                          opcionais: checked
                            ? [...form.especCarro.opcionais, op]
                            : form.especCarro.opcionais.filter((o) => o !== op),
                        },
                      })
                    }
                  />
                  {op}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Especificações da moto
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <FormField label="Cilindrada (cc)" htmlFor="cilindradaCc">
              <Input
                id="cilindradaCc"
                type="number"
                value={form.especMoto.cilindradaCc}
                onChange={(e) =>
                  patch({ especMoto: { ...form.especMoto, cilindradaCc: e.target.value } })
                }
              />
            </FormField>
            <FormField label="Tipo" htmlFor="tipoMoto">
              <NativeSelect
                id="tipoMoto"
                value={form.especMoto.tipo}
                onChange={(e) =>
                  patch({
                    especMoto: {
                      ...form.especMoto,
                      tipo: e.target.value as typeof form.especMoto.tipo,
                    },
                  })
                }
              >
                {[
                  "Street",
                  "Naked",
                  "Trail/Big trail",
                  "Scooter",
                  "Custom",
                  "Esportiva",
                  "Cub/Mobilete",
                  "Off-road",
                  "Triciclo",
                ].map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Nº de marchas" htmlFor="marchas">
              <Input
                id="marchas"
                type="number"
                value={form.especMoto.marchas}
                onChange={(e) =>
                  patch({ especMoto: { ...form.especMoto, marchas: e.target.value } })
                }
              />
            </FormField>
            <FormField label="Partida" htmlFor="partida">
              <NativeSelect
                id="partida"
                value={form.especMoto.partida}
                onChange={(e) =>
                  patch({
                    especMoto: {
                      ...form.especMoto,
                      partida: e.target.value as typeof form.especMoto.partida,
                    },
                  })
                }
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                <NativeSelectOption value="Elétrica">Elétrica</NativeSelectOption>
                <NativeSelectOption value="Pedal">Pedal</NativeSelectOption>
                <NativeSelectOption value="Ambas">Ambas</NativeSelectOption>
              </NativeSelect>
            </FormField>
            <FormField label="Sistema de freio" htmlFor="sistemaFreio">
              <NativeSelect
                id="sistemaFreio"
                value={form.especMoto.sistemaFreio}
                onChange={(e) =>
                  patch({
                    especMoto: {
                      ...form.especMoto,
                      sistemaFreio: e.target.value as typeof form.especMoto.sistemaFreio,
                    },
                  })
                }
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                <NativeSelectOption value="ABS">ABS</NativeSelectOption>
                <NativeSelectOption value="CBS">CBS</NativeSelectOption>
                <NativeSelectOption value="Convencional">Convencional</NativeSelectOption>
              </NativeSelect>
            </FormField>
            <FormField label="Tipo de roda" htmlFor="tipoRoda">
              <NativeSelect
                id="tipoRoda"
                value={form.especMoto.tipoRoda}
                onChange={(e) =>
                  patch({
                    especMoto: {
                      ...form.especMoto,
                      tipoRoda: e.target.value as typeof form.especMoto.tipoRoda,
                    },
                  })
                }
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                <NativeSelectOption value="Raio">Raio</NativeSelectOption>
                <NativeSelectOption value="Liga leve">Liga leve</NativeSelectOption>
              </NativeSelect>
            </FormField>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Acessórios</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {ACESSORIOS_MOTO.map((ac) => (
                <label key={ac} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.especMoto.acessorios.includes(ac)}
                    onCheckedChange={(checked) =>
                      patch({
                        especMoto: {
                          ...form.especMoto,
                          acessorios: checked
                            ? [...form.especMoto.acessorios, ac]
                            : form.especMoto.acessorios.filter((a) => a !== ac),
                        },
                      })
                    }
                  />
                  {ac}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
