export type ObraTeamMember = { role: string };

/**
 * Valida la composición mínima y los roles únicos del equipo de una obra.
 * Solo puede haber un Residente y un Administrativo por obra.
 */
export function validarEquipoObra(team: ObraTeamMember[]): string | null {
  const roles = new Set(team.map((m) => m.role));
  if (!roles.has("residente") || !roles.has("administrativo")) {
    return "Se requiere mínimo un Residente y un Administrativo";
  }

  if (team.filter((m) => m.role === "residente").length > 1) {
    return "Solo puede haber un Residente en la obra";
  }
  if (team.filter((m) => m.role === "administrativo").length > 1) {
    return "Solo puede haber un Administrativo en la obra";
  }

  return null;
}

/**
 * Valida que todas las comisiones pertenezcan a integrantes del equipo de la obra.
 */
export function validarComisionesEquipo(
  team: Array<{ user_id: string }>,
  comisiones: Array<{ user_id: string }>,
): string | null {
  const commissionIds = comisiones.map((c) => c.user_id);
  if (new Set(commissionIds).size !== commissionIds.length) {
    return "No puedes asignar más de una comisión a la misma persona";
  }

  const teamIds = new Set(team.map((t) => t.user_id).filter(Boolean));
  if (comisiones.some((c) => !teamIds.has(c.user_id))) {
    return "Solo puedes asignar comisiones a integrantes del equipo de la obra";
  }
  return null;
}

/** Devuelve el rol sugerido para una nueva fila del equipo. */
export function siguienteRolEquipo(
  team: ObraTeamMember[],
): "residente" | "administrativo" | "auxiliar" {
  const roles = new Set(team.map((m) => m.role));
  if (!roles.has("residente")) return "residente";
  if (!roles.has("administrativo")) return "administrativo";
  return "auxiliar";
}
