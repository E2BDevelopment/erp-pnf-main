"use client";

import { EquipoModule } from "@/components/equipo/EquipoModule";

export default function EquipoPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>

      </header>
      <EquipoModule />
    </div>
  );
}
