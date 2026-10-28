"use client";

import { ObraShell } from "@/components/ObraShell";

export default function ObraLayout({ children }: { children: React.ReactNode }) {
  return <ObraShell>{children}</ObraShell>;
}
