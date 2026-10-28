"use client";

import { useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAuthStore } from "@/stores/auth";

/**
 * Client-side guard equivalent to the old TanStack `/_authenticated` route.
 * Supabase sessions live in browser storage, so the check runs on the client.
 */
export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const loading = useAuthStore((s) => s.loading);
  const userId = useAuthStore((s) => s.userId);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!loading && !userId) {
      navigate({ to: "/login", replace: true });
    } else if (!loading && userId && profile && !profile.company_id) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, userId, profile, navigate]);

  if (loading || !userId || !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="grid size-10 place-items-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
          >
            P
          </div>
          <p className="text-sm text-muted-foreground">Cargando tu empresa…</p>
        </div>
      </div>
    );
  }

  if (!profile.company_id) return null;

  return <>{children}</>;
}
