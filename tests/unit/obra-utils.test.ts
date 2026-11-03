import { describe, expect, it } from "vitest";
import { siguienteRolEquipo, validarEquipoObra } from "@/lib/obra-utils";

describe("validarEquipoObra", () => {
  it("acepta un Residente y un Administrativo, con roles adicionales", () => {
    expect(
      validarEquipoObra([
        { role: "residente" },
        { role: "administrativo" },
        { role: "auxiliar" },
        { role: "supervisor" },
      ]),
    ).toBeNull();
  });

  it("exige Residente y Administrativo", () => {
    expect(validarEquipoObra([{ role: "residente" }])).toBe(
      "Se requiere mínimo un Residente y un Administrativo",
    );
    expect(validarEquipoObra([{ role: "administrativo" }])).toBe(
      "Se requiere mínimo un Residente y un Administrativo",
    );
  });

  it("rechaza más de un Residente", () => {
    expect(
      validarEquipoObra([{ role: "residente" }, { role: "residente" }, { role: "administrativo" }]),
    ).toBe("Solo puede haber un Residente en la obra");
  });

  it("rechaza más de un Administrativo", () => {
    expect(
      validarEquipoObra([
        { role: "residente" },
        { role: "administrativo" },
        { role: "administrativo" },
      ]),
    ).toBe("Solo puede haber un Administrativo en la obra");
  });
});

describe("siguienteRolEquipo", () => {
  it("sugiere Residente, luego Administrativo y después Auxiliar", () => {
    expect(siguienteRolEquipo([])).toBe("residente");
    expect(siguienteRolEquipo([{ role: "residente" }])).toBe("administrativo");
    expect(siguienteRolEquipo([{ role: "residente" }, { role: "administrativo" }])).toBe(
      "auxiliar",
    );
  });
});
