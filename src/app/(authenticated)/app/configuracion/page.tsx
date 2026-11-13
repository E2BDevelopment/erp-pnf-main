"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { EquipoModule } from "@/components/equipo/EquipoModule";
import {
  FacturacionTab,
  type FacturacionTabHandle,
} from "@/components/configuracion/FacturacionTab";
import {
  ConfiguracionTab,
  type ConfiguracionTabHandle,
} from "@/components/configuracion/ConfiguracionTab";
import { IdentidadTab } from "@/components/configuracion/IdentidadTab";
import { CuentasTab } from "@/components/configuracion/CuentasTab";
import { PermisosTab } from "@/components/configuracion/PermisosTab";
import { NotificacionesTab } from "@/components/configuracion/NotificacionesTab";
import { DocumentosTab } from "@/components/configuracion/DocumentosTab";
import { useEffectiveIsDirector } from "@/stores/auth";

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const director = useEffectiveIsDirector();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "facturacion";
  const [tab, setTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const facturacionRef = useRef<FacturacionTabHandle>(null);
  const configRef = useRef<ConfiguracionTabHandle>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    if (!director) navigate({ to: "/app", replace: true });
  }, [director, navigate]);

  if (!director) return null;

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      await Promise.all([facturacionRef.current?.submitAsync(), configRef.current?.submitAsync()]);
      navigate({ to: "/app" });
    } catch {
      // error toast ya lo muestra la mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configuración de empresa</h1>

        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/app" })} disabled={saving}>
            Descartar
          </Button>
          <Button onClick={handleSaveAndClose} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max flex-nowrap">
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="configuracion">General</TabsTrigger>
            <TabsTrigger value="identidad">Identidad</TabsTrigger>
            <TabsTrigger value="equipo">Equipo</TabsTrigger>
            <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
            <TabsTrigger value="permisos">Permisos</TabsTrigger>
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            <TabsTrigger value="documentacion">Documentos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="facturacion" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Datos de facturación</CardTitle>
            </CardHeader>
            <CardContent>
              <FacturacionTab ref={facturacionRef} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Configuración general</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfiguracionTab ref={configRef} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identidad" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Identidad visual</CardTitle>
            </CardHeader>
            <CardContent>
              <IdentidadTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipo" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Equipo de la empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <EquipoModule />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuentas" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Cuentas bancarias y caja fuerte</CardTitle>
            </CardHeader>
            <CardContent>
              <CuentasTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permisos" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Permisos por rol</CardTitle>
            </CardHeader>
            <CardContent>
              <PermisosTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="notificaciones"
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones por rol</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificacionesTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentacion" forceMount className="mt-4 data-[state=inactive]:hidden">
          <Card>
            <CardHeader>
              <CardTitle>Documentación de la empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentosTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
