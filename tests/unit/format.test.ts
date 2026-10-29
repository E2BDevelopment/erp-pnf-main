import { describe, expect, it } from "vitest";
import {
  estadoVencimiento,
  formatDate,
  formatDateTime,
  formatMXN,
  formatRelativeTime,
} from "@/lib/format";

describe("formatMXN", () => {
  it("formatea pesos mexicanos con dos decimales", () => {
    expect(formatMXN(1234.5)).toBe("$1,234.50");
    expect(formatMXN(0)).toBe("$0.00");
    expect(formatMXN(-1234.5)).toBe("-$1,234.50");
  });

  it("devuelve guion para nulos, indefinidos y NaN", () => {
    expect(formatMXN(null)).toBe("—");
    expect(formatMXN(undefined)).toBe("—");
    expect(formatMXN(Number.NaN)).toBe("—");
  });

  it("acepta números en texto", () => {
    expect(formatMXN("2500" as unknown as number)).toBe("$2,500.00");
  });
});

describe("formatDate / formatDateTime", () => {
  it("formatea una fecha ISO con hora sin perder el día", () => {
    const out = formatDate("2026-10-29T12:00:00");
    expect(out).toContain("2026");
    expect(out).toContain("29");
  });

  it("devuelve guion para valores vacíos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
  });

  it("incluye fecha y hora en formatDateTime", () => {
    const out = formatDateTime("2026-10-29T15:45:00");
    expect(out).toContain("2026");
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it.fails("formatDate no debe desplazar un día las fechas YYYY-MM-DD (UTC vs local)", () => {
    // Bug conocido: new Date("2026-10-29") se interpreta como medianoche UTC y en
    // America/Mexico_City se muestra como 28 de octubre.
    expect(formatDate("2026-10-29")).toContain("29");
  });
});

describe("formatRelativeTime", () => {
  it("devuelve 'ahora' para el presente", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("ahora");
  });

  it("usa unidades relativas en español", () => {
    const cincoMin = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(cincoMin)).toContain("5");
    expect(formatRelativeTime(cincoMin)).toContain("minuto");

    const dosDias = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(dosDias)).toMatch(/2|anteayer/);
  });

  it("cae a fecha absoluta después de una semana", () => {
    const out = formatRelativeTime(new Date(Date.now() - 10 * 24 * 60 * 60_000).toISOString());
    expect(out).toMatch(/\d{4}/);
  });

  it("devuelve el valor original si la fecha es inválida", () => {
    expect(formatRelativeTime("no-es-fecha")).toBe("no-es-fecha");
    expect(formatRelativeTime(null)).toBe("—");
  });
});

describe("estadoVencimiento", () => {
  const enDias = (dias: number) =>
    new Date(Date.now() + dias * 24 * 60 * 60_000).toISOString();

  it("sin fecha ni url => sin_documento", () => {
    expect(estadoVencimiento(null)).toBe("sin_documento");
    expect(estadoVencimiento(undefined, null)).toBe("sin_documento");
    expect(estadoVencimiento("", "")).toBe("sin_documento");
  });

  it("fecha inválida => sin_documento", () => {
    expect(estadoVencimiento("no-es-fecha", "https://x.test/doc.pdf")).toBe("sin_documento");
  });

  it("clasifica vencido, por vencer y vigente", () => {
    expect(estadoVencimiento(enDias(-1))).toBe("vencido");
    expect(estadoVencimiento(enDias(10))).toBe("por_vencer");
    expect(estadoVencimiento(enDias(31))).toBe("ok");
  });

  it("una fecha sin url sigue siendo documento", () => {
    expect(estadoVencimiento(enDias(60), null)).toBe("ok");
  });
});
