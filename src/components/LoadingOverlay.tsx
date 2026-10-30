"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export function LoadingOverlay() {
  const pathname = usePathname();
  const loading = useAuthStore((state) => state.loading);
  const visible =
    loading && (pathname.startsWith("/app") || pathname === "/login" || pathname === "/onboarding");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let disposed = false;
    let destroy = () => {};

    void import("lottie-web").then(({ default: lottie }) => {
      if (disposed || !containerRef.current) return;
      const animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/assets/img/loader.json",
      });
      destroy = () => animation.destroy();
    });

    return () => {
      disposed = true;
      destroy();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/55 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Cargando información"
    >
      <div ref={containerRef} className="size-56 max-sm:size-44" aria-hidden="true" />
      <span className="sr-only">Cargando información…</span>
    </div>
  );
}
