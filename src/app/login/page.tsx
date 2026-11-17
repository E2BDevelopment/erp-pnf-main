"use client";

import { Link, useNavigate } from "@/lib/navigation";
import Image from "next/image";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/lib/toast";

const REMEMBER_EMAIL_KEY = "login:remember-email";
const KEEP_SESSION_KEY = "login:keep-session";

function LoginPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const profile = useAuthStore((s) => s.profile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [keepSession, setKeepSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitLocked = useRef(false);

  // Cargar email recordado al montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    }
    const keep = localStorage.getItem(KEEP_SESSION_KEY);
    if (keep === "false") setKeepSession(false);
  }, []);

  useEffect(() => {
    if (userId && profile) {
      navigate({ to: profile.company_id ? "/app" : "/onboarding", replace: true });
    }
  }, [userId, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLocked.current) return;
    submitLocked.current = true;
    setSubmitting(true);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        submitLocked.current = false;
        setSubmitting(false);
        setLoading(false);
        toast.error(error.message);
        return;
      }

      // Guardar preferencia de "Recuerda mi cuenta"
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      // Guardar preferencia de "Mantén mi sesión abierta"
      localStorage.setItem(KEEP_SESSION_KEY, String(keepSession));

      // Si el usuario NO quiere mantener la sesión abierta, cerrar sesión al cerrar pestaña/navegador
      if (!keepSession) {
        const handler = () => {
          void supabase.auth.signOut();
        };
        window.addEventListener("beforeunload", handler);
      }
      // navigation happens via AuthSync useEffect
    } catch (error) {
      submitLocked.current = false;
      setSubmitting(false);
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Volver al inicio
        </Link>
        <Card className="w-full">
          <CardHeader>
            <Image
              src="/assets/img/icon-1.png"
              alt="Logotipo de ERP PNF"
              width={80}
              height={80}
              priority
              className="mx-auto mb-3 size-20 rounded-lg object-contain"
            />
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Accede a tu cuenta de ERP PNF.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-email"
                    checked={rememberEmail}
                    onCheckedChange={(v) => setRememberEmail(v === true)}
                  />
                  <Label htmlFor="remember-email" className="cursor-pointer font-normal">
                    Recuerda mi cuenta
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="keep-session"
                    checked={keepSession}
                    onCheckedChange={(v) => setKeepSession(v === true)}
                  />
                  <Label htmlFor="keep-session" className="cursor-pointer font-normal">
                    Mantén mi sesión abierta
                  </Label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Ingresando…" : "Ingresar"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link to="/onboarding" className="text-primary-ink hover:underline">
                  Registra tu empresa
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default LoginPage;
