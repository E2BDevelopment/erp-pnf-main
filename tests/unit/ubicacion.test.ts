import { describe, expect, it } from "vitest";
import { buildMapsHref, isUrl, ubicacionDisplayText } from "@/lib/ubicacion";
import { ESTADOS_MX } from "@/lib/mx-estados";

describe("ubicacion", () => {
  it("detecta URLs http y https", () => {
    expect(isUrl("https://maps.app.goo.gl/abc")).toBe(true);
    expect(isUrl("HTTP://ejemplo.test")).toBe(true);
    expect(isUrl("Av. Juárez 123")).toBe(false);
    expect(isUrl("")).toBe(false);
  });

  it("respeta una URL existente", () => {
    expect(buildMapsHref("https://maps.app.goo.gl/abc")).toBe("https://maps.app.goo.gl/abc");
  });

  it("construye búsqueda de Google Maps para texto libre", () => {
    expect(buildMapsHref("Av. Juárez 123, Centro")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Ju%C3%A1rez%20123%2C%20Centro",
    );
  });

  it("devuelve null para ubicación vacía", () => {
    expect(buildMapsHref(null)).toBeNull();
    expect(buildMapsHref("   ")).toBeNull();
  });

  it("muestra 'Ver en Google Maps' solo para URLs", () => {
    expect(ubicacionDisplayText("https://maps.test/x")).toBe("Ver en Google Maps");
    expect(ubicacionDisplayText("Obra Norte")).toBe("Obra Norte");
    expect(ubicacionDisplayText(null)).toBe("");
  });
});

describe("ESTADOS_MX", () => {
  it("contiene las 32 entidades federativas sin duplicados", () => {
    expect(ESTADOS_MX).toHaveLength(32);
    expect(new Set(ESTADOS_MX).size).toBe(32);
  });

  it("incluye las entidades clave para una constructora", () => {
    expect(ESTADOS_MX).toContain("Ciudad de México");
    expect(ESTADOS_MX).toContain("Jalisco");
    expect(ESTADOS_MX).toContain("Nuevo León");
    expect(ESTADOS_MX).toContain("Guanajuato");
  });
});
