import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATALOGO_ACCIONES, isObraAction } from "@/lib/permisos/catalogo";
import { hasPermission, overridesFromRows } from "@/lib/permisos/check";

describe("permisos por obra", () => {
  const action = "requisiciones.crear";
  const company = overridesFromRows([{ role: "residente", action_key: action, allowed: true }]);
  const denied = overridesFromRows([{ role: "residente", action_key: action, allowed: false }]);

  it("hereda la empresa si no existe excepción y restaura la herencia al retirarla", () => {
    expect(hasPermission(action, ["residente"], company)).toBe(true);
    expect(hasPermission(action, ["residente"], company, denied)).toBe(false);
    expect(hasPermission(action, ["residente"], company, new Map())).toBe(true);
  });

  it("una excepción permite lo que la empresa deniega", () => {
    expect(hasPermission(action, ["residente"], denied, company)).toBe(true);
  });

  it("la excepción no altera los permisos de otra obra o acción", () => {
    expect(hasPermission(action, ["residente"], company, denied)).toBe(false);
    expect(hasPermission(action, ["residente"], company)).toBe(true);
    expect(hasPermission("presupuestos.crear_oc", ["residente"], company, denied)).toBe(true);
  });

  it("mantiene la unión entre roles y el acceso total del Director", () => {
    expect(hasPermission(action, ["residente", "supervisor"], company, denied)).toBe(true);
    expect(hasPermission(action, ["director"], company, denied)).toBe(true);
  });

  it("identifica los roles personalizados por ID y deniega acciones nuevas sin configurar", () => {
    const custom = "94d319ed-bf6c-42ed-8d6c-928b93282841";
    expect(hasPermission(action, [custom], company)).toBe(false);
    const grant = overridesFromRows([{ role: custom, action_key: action, allowed: true }]);
    expect(hasPermission(action, [custom], company, grant)).toBe(true);
    expect(hasPermission("presupuestos.crear_oc", [custom], company, grant)).toBe(false);
  });

  it("excluye acciones corporativas y desconocidas", () => {
    for (const key of [
      "obras.crear",
      "catalogos.insumos.crear",
      "gastos_oficina.ver",
      "tesoreria.ver",
      "almacen_central.ver",
      "contabilidad.ver_balance",
      "no.existe",
    ]) {
      expect(isObraAction(key)).toBe(false);
    }
    expect(isObraAction("obras.editar")).toBe(true);
    expect(isObraAction("cxp.registrar_pago")).toBe(true);
  });

  it("mantiene el catálogo SQL alineado con las acciones y defaults del servidor", () => {
    const sql = readFileSync(
      "supabase/migrations/20261106020000_obra_role_permissions.sql",
      "utf8",
    );
    const snapshot = sql.match(/SELECT '({[^\n]+})'::jsonb/);
    expect(snapshot).not.toBeNull();
    expect(JSON.parse(snapshot![1])).toEqual(
      Object.fromEntries(
        CATALOGO_ACCIONES.filter((a) => isObraAction(a.key)).map((a) => [a.key, a.defaults]),
      ),
    );
  });
});
