"use client";

import { create } from "zustand";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface AuthProfile {
  id: string;
  email: string;
  nombre_completo: string;
  company_id: string | null;
}

interface AuthState {
  userId: string | null;
  profile: AuthProfile | null;
  roles: AppRole[];
  loading: boolean;
  setSession: (data: {
    userId: string | null;
    profile: AuthProfile | null;
    roles: AppRole[];
  }) => void;
  setProfile: (profile: AuthProfile) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  userId: null,
  profile: null,
  roles: [],
  loading: true,
  setSession: ({ userId, profile, roles }) => set({ userId, profile, roles, loading: false }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ userId: null, profile: null, roles: [], loading: false }),
}));

export function isDirector(roles: AppRole[]): boolean {
  return roles.includes("director");
}

export function useEffectiveRoles(): AppRole[] {
  return useAuthStore((s) => s.roles);
}

export function useEffectiveIsDirector(): boolean {
  return useAuthStore((s) => isDirector(s.roles));
}

export function useRealIsDirector(): boolean {
  return useAuthStore((s) => isDirector(s.roles));
}

export function canAccess(roles: AppRole[], allowed: AppRole[]): boolean {
  if (isDirector(roles)) return true;
  return roles.some((r) => allowed.includes(r));
}
