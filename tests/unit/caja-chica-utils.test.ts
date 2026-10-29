import { describe, expect, it } from "vitest";
import { montoGastoObra, IVA_RATE } from "@/lib/caja-chica-utils";

describe("montoGastoObra", () => {
  it("descuenta el IVA acreditable de una factura", () => {
    expect(montoGastoObra(116, "factura")).toBe(100);
    expect(montoGastoObra(232, "factura")).toBe(200);
  });

  it("redondea a dos decimales", () => {
    expect(montoGastoObra(100, "factura")).toBe(86.21);
    expect(montoGastoObra(1, "factura")).toBe(0.86);
  });

  it("no descuenta IVA en notas o sin comprobante", () => {
    expect(montoGastoObra(116, "nota")).toBe(116);
    expect(montoGastoObra(116, "ninguno")).toBe(116);
    expect(montoGastoObra(116, null)).toBe(116);
    expect(montoGastoObra(116, "otro")).toBe(116);
  });

  it("tolera montos nulos o inválidos", () => {
    expect(montoGastoObra(null as unknown as number, "factura")).toBe(0);
    expect(montoGastoObra(Number.NaN, "factura")).toBe(0);
    expect(montoGastoObra(0, "factura")).toBe(0);
  });

  it("expone la tasa de IVA general de México", () => {
    expect(IVA_RATE).toBe(0.16);
  });
});
