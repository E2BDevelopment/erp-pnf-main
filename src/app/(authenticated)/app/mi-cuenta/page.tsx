"use client";

import { useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useAuthStore, type AppRole } from "@/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { updateMyProfile } from "@/lib/api-client/auth.functions";

const ROLE_LABELS: Record<AppRole, string> = {
  director: "Director",
  residente: "Residente",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
  supervisor: "Supervisor",
};

export default function MiCuentaPage() {
  const profile = useAuthStore((s) => s.profile);
  const roles = useAuthStore((s) => s.roles);
  const setProfile = useAuthStore((s) => s.setProfile);
  const updateFn = useServerFn(updateMyProfile);

  const [nombre, setNombre] = useState(profile?.nombre_completo ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const rolUsuario = roles.map((role) => ROLE_LABELS[role] ?? role).join(", ") || "Sin rol asignado";

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSavingProfile(true);
    try {
      const updated = await updateFn({ data: { nombre_completo: nombre.trim() } });
      setProfile({
        id: updated.id,
        email: updated.email ?? profile?.email ?? "",
        nombre_completo: updated.nombre_completo ?? "",
        company_id: updated.company_id ?? null,
      });
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>

      </header>

      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Input id="rol" value={rolUsuario} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Guardando…" : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? "Guardando…" : "Actualizar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
