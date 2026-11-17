import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  companyId: "empresa-a",
  director: true,
  insumos: [] as Array<{ nombre: string; company_id: string }>,
  error: null as { message: string } | null,
  from: vi.fn(),
  range: vi.fn(),
}));

vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: {
    run: async () => ({ supabase: { from: db.from }, userId: "director-a" }),
  },
}));

import { importarInsumos, validarImportacionInsumos } from "@/lib/api/insumos.functions";

const fila = { row: 2, nombre: "Cemento", unidad: "BTO", categoria: "Materiales" };

beforeEach(() => {
  db.companyId = "empresa-a";
  db.director = true;
  db.insumos = [];
  db.error = null;
  db.from.mockReset();
  db.range.mockReset();
  db.from.mockImplementation((table: string) => {
    let companyId: string;
    const query = {
      select: () => query,
      eq: (column: string, value: string) => {
        if (column === "company_id") companyId = value;
        return query;
      },
      order: () => query,
      maybeSingle: async () => ({ data: { company_id: db.companyId } }),
      range: db.range.mockImplementation(async (start: number, end: number) => ({
        data: db.insumos.filter((i) => i.company_id === companyId).slice(start, end + 1),
        error: db.error,
      })),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data: table === "user_roles" && db.director ? [{ role: "director" }] : [],
        }).then(resolve),
    };
    return query;
  });
});

describe("validación de insumos antes de importar", () => {
  it("identifica las filas existentes ignorando mayúsculas y espacios exteriores", async () => {
    db.insumos = [{ nombre: " CEMENTO ", company_id: "empresa-a" }];
    const result = await validarImportacionInsumos({
      data: { filas: [fila, { ...fila, row: 3, nombre: "Arena" }] },
    });
    expect(result.errores).toEqual([
      { ...fila, error: "Ya existe en el catálogo de insumos de tu empresa" },
    ]);
    expect(db.from.mock.calls.map(([table]) => table)).toEqual([
      "profiles", "user_roles", "insumos",
    ]);
  });

  it("no considera duplicados los insumos de otras empresas", async () => {
    db.insumos = [{ nombre: "Cemento", company_id: "empresa-b" }];
    expect(await validarImportacionInsumos({ data: { filas: [fila] } })).toEqual({ errores: [] });
  });

  it("revisa el catálogo completo cuando hay más de mil insumos", async () => {
    db.insumos = Array.from({ length: 1000 }, (_, i) => ({
      nombre: `Insumo ${i}`, company_id: "empresa-a",
    }));
    db.insumos.push({ nombre: "Cemento", company_id: "empresa-a" });
    const result = await validarImportacionInsumos({ data: { filas: [fila] } });
    expect(result.errores).toHaveLength(1);
    expect(db.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it("identifica duplicados dentro del archivo conservando la fila original", async () => {
    const result = await validarImportacionInsumos({
      data: { filas: [fila, { ...fila, nombre: "CEMENTO", row: 5 }] },
    });
    expect(result.errores[0]).toMatchObject({ row: 5, error: "Duplicado en el archivo (fila 2)" });
  });

  it("rechaza la validación para usuarios que no son Director", async () => {
    db.director = false;
    await expect(validarImportacionInsumos({ data: { filas: [fila] } })).rejects.toThrow(
      "Solo el Director puede importar insumos",
    );
    expect(db.from).not.toHaveBeenCalledWith("insumos");
  });

  it("no presenta el archivo como válido cuando falla la consulta", async () => {
    db.error = { message: "Consulta fallida" };
    await expect(validarImportacionInsumos({ data: { filas: [fila] } })).rejects.toThrow(
      "Consulta fallida",
    );
  });

  it("vuelve a validar al confirmar y evita crear catálogos si ya existe un insumo", async () => {
    expect(await validarImportacionInsumos({ data: { filas: [fila] } })).toEqual({ errores: [] });
    db.insumos.push({ nombre: "Cemento", company_id: "empresa-a" });
    const result = await importarInsumos({
      data: { filas: [fila], unidadesNuevas: [{ codigo: "BTO", nombre: "Bulto" }], categoriasNuevas: [] },
    });
    expect(result.ok).toBe(false);
    expect(db.from).not.toHaveBeenCalledWith("insumo_unidades");
    expect(db.from).not.toHaveBeenCalledWith("insumo_categorias");
  });
});
