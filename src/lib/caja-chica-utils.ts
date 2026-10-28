/** Tasa de IVA general en México (16%). */
export const IVA_RATE = 0.16;

/**
 * Monto que se carga al costo de la obra para un gasto de caja chica.
 * - factura: base sin IVA (monto / 1.16) — el IVA es acreditable, no es costo.
 * - nota / ninguno: monto total — sin IVA acreditable.
 */
export function montoGastoObra(
  monto: number,
  tipoComprobante: "factura" | "nota" | "ninguno" | string | null | undefined,
): number {
  const m = Number(monto) || 0;
  if (tipoComprobante === "factura") {
    return Math.round((m / (1 + IVA_RATE)) * 100) / 100;
  }
  return m;
}
