import { describe, expect, it } from "vitest";
import {
  calcularSemana,
  formatRangoSemana,
  numeroSemanaObra,
  rangoSemanaObra,
  toISODate,
} from "@/lib/estimacion-utils";

describe("calcularSemana", () => {
  it.each([
    ["lunes", "2026-10-26"],
    ["miércoles", "2026-10-28"],
    ["domingo", "2026-11-01"],
  ])("agrupa %s en la semana lunes-domingo", (_dia, fecha) => {
    expect(calcularSemana(fecha)).toEqual({ inicio: "2026-10-26", fin: "2026-11-01" });
  });

  it("cruza correctamente el cambio de mes", () => {
    expect(calcularSemana("2026-12-31")).toEqual({ inicio: "2026-12-28", fin: "2027-01-03" });
  });

  it("acepta un objeto Date", () => {
    expect(calcularSemana(new Date("2026-10-28T12:00:00"))).toEqual({
      inicio: "2026-10-26",
      fin: "2026-11-01",
    });
  });
});

describe("toISODate", () => {
  it("rellena mes y día con cero", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toISODate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("formatRangoSemana", () => {
  it("formatea el rango en español", () => {
    const out = formatRangoSemana("2026-10-26", "2026-11-01");
    expect(out).toContain("26");
    expect(out).toContain("01");
    expect(out).toContain("2026");
  });
});

describe("numeroSemanaObra", () => {
  it("la primera semana ISO que contiene el inicio es la 1", () => {
    // La obra inicia miércoles 7 de enero; su semana ISO empieza el lunes 5.
    expect(numeroSemanaObra("2026-01-07", "2026-01-05")).toBe(1);
    expect(numeroSemanaObra("2026-01-07", "2026-01-12")).toBe(2);
    expect(numeroSemanaObra("2026-01-07", "2026-01-19")).toBe(3);
  });

  it("funciona si la obra inicia en lunes", () => {
    expect(numeroSemanaObra("2026-01-05", "2026-01-05")).toBe(1);
    expect(numeroSemanaObra("2026-01-05", "2026-01-12")).toBe(2);
  });
});

describe("rangoSemanaObra", () => {
  it("la primera semana recorta el inicio a la fecha de la obra", () => {
    const out = rangoSemanaObra("2026-01-07", "2026-01-05");
    expect(out).toContain("07");
    expect(out).toContain("11");
  });

  it("las semanas posteriores usan lunes-domingo completo", () => {
    const out = rangoSemanaObra("2026-01-07", "2026-01-12");
    expect(out).toContain("12");
    expect(out).toContain("18");
  });
});
