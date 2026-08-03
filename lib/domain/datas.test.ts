import { describe, it, expect } from "vitest";
import { dataIsoLocal } from "./datas";

describe("dataIsoLocal", () => {
  it("formata a data do fuso local, não a data em UTC", () => {
    expect(dataIsoLocal(new Date(2026, 7, 3, 10, 0))).toBe("2026-08-03");
  });

  it("mantém o dia de hoje mesmo à noite (bug real: toISOString virava o dia em UTC-3)", () => {
    // Às 21h30 no horário de Brasília já são 00h30 do dia seguinte em UTC —
    // `toISOString().slice(0, 10)` gravava a data de amanhã.
    expect(dataIsoLocal(new Date(2026, 7, 3, 21, 30))).toBe("2026-08-03");
    expect(dataIsoLocal(new Date(2026, 7, 3, 23, 59))).toBe("2026-08-03");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(dataIsoLocal(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
