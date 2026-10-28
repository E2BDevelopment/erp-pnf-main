import {
  FileText,
  Wallet,
  Scale,
  Warehouse,
  Receipt,
  Users,
  Hammer,
  Handshake,
  Truck,
  Fuel,
  Coins,
  CalendarRange,
  ListTodo,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type ModuleEntry = {
  to: string;
  label: string;
  icon: LucideIcon;
  ready?: boolean;
  /** Permiso que decide si el módulo aparece en la navegación. */
  verKey: string;
};

export type ModuleGroup = {
  label: string;
  modules: ModuleEntry[];
};

/**
 * Los catorce módulos administrativos en grupos de trabajo, no en una lista de
 * catorce filas: comprar, pagar, operar la obra y cerrar la oficina. Los grupos
 * siguen el orden real de la cadena documental.
 */
export const ADMIN_GROUPS: ModuleGroup[] = [
  {
    label: "Compras",
    modules: [
      {
        to: "/app/admin/requisiciones",
        label: "Requisiciones",
        icon: ClipboardList,
        verKey: "requisiciones.ver",
      },
      {
        to: "/app/admin/almacen-central",
        label: "Almacén central",
        icon: Warehouse,
        verKey: "almacen_central.ver",
      },
    ],
  },
  {
    label: "Dinero",
    modules: [
      {
        to: "/app/admin/cuentas-por-pagar",
        label: "Cuentas por pagar",
        icon: FileText,
        verKey: "cxp.ver",
      },
      { to: "/app/admin/tesoreria", label: "Tesorería", icon: Wallet, verKey: "tesoreria.ver" },
      {
        to: "/app/admin/contabilidad",
        label: "Contabilidad",
        icon: Scale,
        verKey: "contabilidad.ver_balance",
      },
      {
        to: "/app/admin/condensado-semanal",
        label: "Condensado semanal",
        icon: CalendarRange,
        verKey: "contabilidad.ver_condensado",
      },
    ],
  },
  {
    label: "Obra",
    modules: [
      { to: "/app/admin/nomina", label: "Nómina", icon: Users, verKey: "nomina.ver" },
      { to: "/app/admin/destajos", label: "Destajos", icon: Hammer, verKey: "destajos.ver" },
      {
        to: "/app/admin/subcontratos",
        label: "Subcontratos",
        icon: Handshake,
        verKey: "subcontratos.ver",
      },
      { to: "/app/admin/rentas", label: "Rentas", icon: Truck, verKey: "rentas.ver" },
      { to: "/app/admin/gasolinas", label: "Gasolinas", icon: Fuel, verKey: "gasolinas.ver" },
    ],
  },
  {
    label: "Operación",
    modules: [
      { to: "/app/admin/caja-chica", label: "Caja chica", icon: Coins, verKey: "caja_chica.ver" },
      {
        to: "/app/admin/gastos-oficina",
        label: "Gastos de oficina",
        icon: Receipt,
        verKey: "gastos_oficina.ver",
      },
      { to: "/app/admin/tareas", label: "Tareas", icon: ListTodo, verKey: "tareas.ver" },
    ],
  },
];

/** Lista plana, en el orden de los grupos. */
export const ADMIN_MODULES: ModuleEntry[] = ADMIN_GROUPS.flatMap((group) => group.modules);
