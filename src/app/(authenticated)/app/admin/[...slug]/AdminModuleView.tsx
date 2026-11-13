"use client";

import { Link, useParams } from "@/lib/navigation";
import { Lock } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { Button } from "@/components/ui/button";
import { NominaAdminPanel } from "@/components/nomina/NominaAdminPanel";
import { GasolinasModule } from "@/components/gasolinas/GasolinasModule";
import { CajaChicaModule } from "@/components/caja-chica/CajaChicaModule";
import { CuentasPorPagarModule } from "@/components/pagos/CuentasPorPagarModule";
import { TesoreriaModule } from "@/components/tesoreria/TesoreriaModule";
import { ContabilidadModule } from "@/components/contabilidad/ContabilidadModule";
import { GastosOficinaModule } from "@/components/gastos-oficina/GastosOficinaModule";
import { CondensadoSemanalModule } from "@/components/condensado-semanal/CondensadoSemanalModule";
import { useEffectiveRoles } from "@/stores/auth";

const LABELS: Record<string, string> = {
  requisiciones: "Requisiciones",
  "cuentas-por-pagar": "Cuentas por pagar",
  tesoreria: "Tesorería",
  contabilidad: "Contabilidad",
  "almacen-central": "Almacén central",
  "gastos-oficina": "Gastos de oficina",
  "condensado-semanal": "Condensado semanal",
  nomina: "Nómina",
  destajos: "Destajos",
  subcontratos: "Subcontratos",
  rentas: "Rentas",
  gasolinas: "Gasolinas",
  "caja-chica": "Caja chica",
  tareas: "Tareas",
};

export function AdminModuleView() {
  const params = useParams<{ _splat?: string }>();
  const slug = (params._splat ?? "").split("/")[0];
  const roles = useEffectiveRoles();

  if (slug === "nomina") return <NominaAdminPanel />;
  if (slug === "gasolinas") return <GasolinasModule scope="admin" />;
  if (slug === "caja-chica") return <CajaChicaModule scope="admin" />;
  if (slug === "cuentas-por-pagar") return <CuentasPorPagarModule />;
  if (slug === "gastos-oficina") return <GastosOficinaModule />;
  if (slug === "condensado-semanal") {
    if (!roles.includes("director") && !roles.includes("administrativo")) {
      return <SinAcceso modulo="Condensado semanal" />;
    }
    return <CondensadoSemanalModule />;
  }
  if (slug === "contabilidad") {
    if (!roles.includes("director") && !roles.includes("administrativo")) {
      return <SinAcceso modulo="Contabilidad" />;
    }
    return <ContabilidadModule />;
  }
  if (slug === "tesoreria") {
    if (!roles.includes("director") && !roles.includes("administrativo")) {
      return <SinAcceso modulo="Tesorería" />;
    }
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Tesorería</h1>

        </header>
        <TesoreriaModule />
      </div>
    );
  }
  const title = LABELS[slug] ?? "Módulo administrativo";
  return <ModulePlaceholder title={title} description="Módulo administrativo" />;
}

/**
 * Permiso denegado: dice qué falta y cómo resolverlo, en lugar de anunciar
 * "Próximamente" un módulo que sí existe pero no le corresponde a este perfil.
 */
function SinAcceso({ modulo }: { modulo: string }) {
  return (
    <ModulePlaceholder
      title={modulo}
      icon={Lock}
      stateTitle="Sin acceso"
      stateDescription={`Tu perfil no tiene permiso para ver ${modulo.toLowerCase()}. Si lo necesitas, pídeselo al Director de la empresa.`}
      action={
        <Button variant="outline" asChild>
          <Link to="/app/obras">Volver a obras</Link>
        </Button>
      }
    />
  );
}
