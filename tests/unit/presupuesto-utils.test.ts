import { describe, expect, it } from "vitest";
import {
  calcularClavesPadre,
  nivelDeClave,
  ordenSort,
  parentDeClave,
  procesarOrdenCambio,
  procesarRenglones,
  reconstruirVigente,
  type RenglonBase,
  type VigenteNode,
} from "@/lib/presupuesto-utils";

describe("claves WBS", () => {
  it("calcula nivel y padre", () => {
    expect(nivelDeClave("1")).toBe(1);
    expect(nivelDeClave("1.2.3")).toBe(3);
    expect(parentDeClave("1")).toBeNull();
    expect(parentDeClave("1.2")).toBe("1");
    expect(parentDeClave("1.2.3")).toBe("1.2");
  });

  it("identifica claves padre", () => {
    expect([...calcularClavesPadre(["1", "1.1", "1.2", "1.2.1", "2"])]).toEqual(["1", "1.2"]);
  });

  it("ordena numéricamente, no lexicográficamente", () => {
    const claves = ["10", "2", "1.10", "1.2", "1.2.1"].sort(ordenSort);
    expect(claves).toEqual(["1.2", "1.2.1", "1.10", "2", "10"]);
  });
});

describe("procesarRenglones", () => {
  const valido = [
    { clave: "1", concepto: "Obra" },
    { clave: "1.1", concepto: "Cimentación", unidad: "m2", cantidad: 10, precio_unitario: 100 },
    { clave: "1.2", concepto: "Estructura", unidad: "m2", cantidad: 5, precio_unitario: 200 },
    { clave: "2", concepto: "Acabados" },
    { clave: "2.1", concepto: "Pintura", unidad: "m2", cantidad: 2, precio_unitario: 50 },
  ];

  it("calcula importes de hojas, grupos y total", () => {
    const r = procesarRenglones(valido);
    expect(r.errores).toEqual([]);
    expect(r.renglones.map((x) => x.clave)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
    expect(r.renglones.map((x) => x.importe)).toEqual([2000, 1000, 1000, 100, 100]);
    expect(r.montoTotal).toBe(2100);
  });

  it("marca grupos y anula sus campos de captura", () => {
    const r = procesarRenglones(valido);
    const grupo = r.renglones.find((x) => x.clave === "1")!;
    expect(grupo.es_grupo).toBe(true);
    expect(grupo.unidad).toBeNull();
    expect(grupo.cantidad).toBeNull();
    expect(grupo.precio_unitario).toBeNull();
    expect(grupo.parent_clave).toBeNull();
    expect(grupo.nivel).toBe(1);
  });

  it("asigna orden consecutivo después de ordenar", () => {
    const r = procesarRenglones([...valido].reverse());
    expect(r.renglones.map((x) => x.orden)).toEqual([0, 1, 2, 3, 4]);
    expect(r.renglones.map((x) => x.clave)).toEqual(["1", "1.1", "1.2", "2", "2.1"]);
  });

  it("rechaza claves vacías, con formato inválido o duplicadas", () => {
    const r = procesarRenglones([
      { clave: "", concepto: "Sin clave" },
      { clave: "1.2.3.4.5.6", concepto: "Demasiado profunda" },
      { clave: "1", concepto: "A" },
      { clave: "1", concepto: "B" },
    ]);
    expect(r.montoTotal).toBe(0);
    expect(r.renglones).toEqual([]);
    expect(r.errores.map((e) => e.index)).toEqual([0, 1, 3]);
    expect(r.errores[0].errores).toContain("Clave vacía");
    expect(r.errores[1].errores[0]).toContain("Formato de clave inválido");
    expect(r.errores[2].errores).toContain("Clave duplicada");
  });

  it("exige concepto", () => {
    const r = procesarRenglones([{ clave: "1", concepto: "   " }]);
    expect(r.errores[0].errores).toContain("Concepto requerido");
  });

  it("exige el renglón padre", () => {
    const r = procesarRenglones([{ clave: "1.1", concepto: "Hija sin padre" }]);
    expect(r.errores[0].errores[0]).toContain('Falta el renglón padre "1"');
  });

  it("acepta cantidades y precios nulos como cero", () => {
    const r = procesarRenglones([
      { clave: "1", concepto: "Obra" },
      { clave: "1.1", concepto: "Sin datos", cantidad: null, precio_unitario: null },
    ]);
    expect(r.errores).toEqual([]);
    expect(r.montoTotal).toBe(0);
  });
});

const base: RenglonBase[] = [
  {
    clave: "1",
    concepto: "Obra",
    unidad: null,
    cantidad: null,
    precio_unitario: null,
    importe: 2000,
    es_grupo: true,
    nivel: 1,
    parent_clave: null,
  },
  {
    clave: "1.1",
    concepto: "Cimentación",
    unidad: "m2",
    cantidad: 10,
    precio_unitario: 100,
    importe: 1000,
    es_grupo: false,
    nivel: 2,
    parent_clave: "1",
  },
  {
    clave: "1.2",
    concepto: "Estructura",
    unidad: "m2",
    cantidad: 5,
    precio_unitario: 200,
    importe: 1000,
    es_grupo: false,
    nivel: 2,
    parent_clave: "1",
  },
];

describe("reconstruirVigente", () => {
  it("sin órdenes de cambio devuelve el base", () => {
    const r = reconstruirVigente(base, []);
    expect(r.montoTotal).toBe(2000);
    expect(r.vigente.find((n) => n.clave === "1.1")?.origen).toBe("base");
  });

  it("aplica modificación, adición y eliminación de una OC", () => {
    const r = reconstruirVigente(base, [
      [
        {
          clave: "1.1",
          tipo_movimiento: "modificacion",
          importe_delta: 200,
          concepto: "Cimentación",
          unidad: "m2",
          cantidad: 12,
          precio_unitario: 100,
        },
        {
          clave: "1.3",
          tipo_movimiento: "adicion",
          importe_delta: 100,
          concepto: "Relleno",
          unidad: "m3",
          cantidad: 2,
          precio_unitario: 50,
        },
        {
          clave: "1.2",
          tipo_movimiento: "eliminacion",
          importe_delta: -1000,
          concepto: "Estructura",
          unidad: "m2",
          cantidad: null,
          precio_unitario: null,
        },
      ],
    ]);

    expect(r.montoTotal).toBe(1300);
    const modificada = r.vigente.find((n) => n.clave === "1.1")!;
    expect(modificada.origen).toBe("modificada");
    expect(modificada.importe).toBe(1200);
    expect(modificada.cantidad_base).toBe(10);
    expect(modificada.cantidad_modificada).toBe(true);
    expect(r.vigente.find((n) => n.clave === "1.3")?.origen).toBe("agregada");
    const eliminada = r.vigente.find((n) => n.clave === "1.2")!;
    expect(eliminada.origen).toBe("eliminada");
    expect(eliminada.importe).toBe(0);
  });

  it("acumula varias OC en orden", () => {
    const r = reconstruirVigente(base, [
      [
        {
          clave: "1.1",
          tipo_movimiento: "modificacion",
          importe_delta: 200,
          concepto: "Cimentación",
          unidad: "m2",
          cantidad: 12,
          precio_unitario: 100,
        },
      ],
      [
        {
          clave: "1.1",
          tipo_movimiento: "modificacion",
          importe_delta: 300,
          concepto: "Cimentación",
          unidad: "m2",
          cantidad: 15,
          precio_unitario: 100,
        },
      ],
    ]);
    expect(r.vigente.find((n) => n.clave === "1.1")?.importe).toBe(1500);
    expect(r.montoTotal).toBe(2500);
  });

  it("ignora modificaciones sobre una hoja eliminada", () => {
    const r = reconstruirVigente(base, [
      [
        {
          clave: "1.2",
          tipo_movimiento: "eliminacion",
          importe_delta: -1000,
          concepto: "Estructura",
          unidad: "m2",
          cantidad: null,
          precio_unitario: null,
        },
      ],
      [
        {
          clave: "1.2",
          tipo_movimiento: "modificacion",
          importe_delta: 500,
          concepto: "Estructura",
          unidad: "m2",
          cantidad: 99,
          precio_unitario: 99,
        },
      ],
    ]);
    expect(r.vigente.find((n) => n.clave === "1.2")?.origen).toBe("eliminada");
    expect(r.montoTotal).toBe(1000);
  });

  it("usa el concepto de la adición para un grupo nuevo", () => {
    const r = reconstruirVigente(base, [
      [
        {
          clave: "2",
          tipo_movimiento: "adicion",
          importe_delta: 0,
          concepto: "Acabados",
          unidad: null,
          cantidad: null,
          precio_unitario: null,
        },
        {
          clave: "2.1",
          tipo_movimiento: "adicion",
          importe_delta: 300,
          concepto: "Pintura",
          unidad: "m2",
          cantidad: 3,
          precio_unitario: 100,
        },
      ],
    ]);
    expect(r.vigente.find((n) => n.clave === "2")?.concepto).toBe("Acabados");
    expect(r.vigente.find((n) => n.clave === "2")?.importe).toBe(300);
    expect(r.montoTotal).toBe(2300);
  });
});

const vigente: VigenteNode[] = [
  {
    clave: "1",
    concepto: "Obra",
    unidad: null,
    cantidad: null,
    precio_unitario: null,
    importe: 2000,
    es_grupo: true,
    nivel: 1,
    parent_clave: null,
    origen: "base",
  },
  {
    clave: "1.1",
    concepto: "Cimentación",
    unidad: "m2",
    cantidad: 10,
    precio_unitario: 100,
    importe: 1000,
    es_grupo: false,
    nivel: 2,
    parent_clave: "1",
    origen: "base",
  },
  {
    clave: "1.2",
    concepto: "Estructura",
    unidad: "m2",
    cantidad: 5,
    precio_unitario: 200,
    importe: 1000,
    es_grupo: false,
    nivel: 2,
    parent_clave: "1",
    origen: "base",
  },
];

describe("procesarOrdenCambio", () => {
  it("calcula deltas de modificación, adición y eliminación", () => {
    const r = procesarOrdenCambio(vigente, [
      {
        clave: "1.1",
        tipo_movimiento: "modificacion",
        cantidad: 15,
        precio_unitario: 100,
        concepto: "Cimentación",
      },
      {
        clave: "1.3",
        tipo_movimiento: "adicion",
        cantidad: 3,
        precio_unitario: 100,
        concepto: "Relleno",
      },
      { clave: "1.2", tipo_movimiento: "eliminacion" },
    ]);
    expect(r.errores).toEqual([]);
    expect(r.montoDelta).toBe(-200);
    expect(r.renglones.map((x) => x.importe_delta)).toEqual([500, -1000, 300]);
  });

  it("rechaza modificar un concepto inexistente o un grupo", () => {
    const r = procesarOrdenCambio(vigente, [
      { clave: "9.9", tipo_movimiento: "modificacion", cantidad: 1, precio_unitario: 1 },
      { clave: "1", tipo_movimiento: "modificacion", cantidad: 1, precio_unitario: 1 },
    ]);
    expect(r.errores).toHaveLength(2);
    expect(r.errores[0].errores).toContain("El concepto no existe en el vigente");
    expect(r.errores[1].errores).toContain("No se puede modificar un grupo, solo hojas");
  });

  it("rechaza adicionar una clave existente o sin padre", () => {
    const r = procesarOrdenCambio(vigente, [
      {
        clave: "1.1",
        tipo_movimiento: "adicion",
        cantidad: 1,
        precio_unitario: 1,
        concepto: "Duplicada",
      },
      {
        clave: "3.1",
        tipo_movimiento: "adicion",
        cantidad: 1,
        precio_unitario: 1,
        concepto: "Sin padre",
      },
    ]);
    expect(r.errores).toHaveLength(2);
    expect(r.errores[0].errores).toContain("La clave ya existe en el vigente");
    expect(r.errores[1].errores[0]).toContain('Falta el renglón padre "3"');
  });

  it("rechaza eliminar un grupo o una clave inexistente", () => {
    const r = procesarOrdenCambio(vigente, [
      { clave: "1", tipo_movimiento: "eliminacion" },
      { clave: "9.9", tipo_movimiento: "eliminacion" },
    ]);
    expect(r.errores).toHaveLength(2);
    expect(r.errores[0].errores).toContain("No se puede eliminar un grupo, solo hojas");
    expect(r.errores[1].errores).toContain("El concepto no existe en el vigente");
  });

  it("rechaza claves duplicadas dentro de la misma OC", () => {
    const r = procesarOrdenCambio(vigente, [
      { clave: "1.1", tipo_movimiento: "modificacion", cantidad: 1, precio_unitario: 1 },
      { clave: "1.1", tipo_movimiento: "modificacion", cantidad: 2, precio_unitario: 2 },
    ]);
    expect(r.errores).toHaveLength(1);
    expect(r.errores[0].errores).toContain("Clave duplicada en esta orden de cambio");
  });

  it("ordena los renglones resultantes por clave", () => {
    const r = procesarOrdenCambio(vigente, [
      { clave: "1.2", tipo_movimiento: "eliminacion" },
      { clave: "1.1", tipo_movimiento: "modificacion", cantidad: 12, precio_unitario: 100 },
    ]);
    expect(r.renglones.map((x) => x.clave)).toEqual(["1.1", "1.2"]);
    expect(r.renglones.map((x) => x.orden)).toEqual([0, 1]);
  });
});
