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
    let revision = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotion = () => {
      const currentRevision = ++revision;
      destroy();
      destroy = () => {};
      if (reducedMotion.matches) return;

      void import("lottie-web").then(({ default: lottie }) => {
        if (disposed || currentRevision !== revision || !containerRef.current) return;
        const animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/assets/img/loader.json",
        });
        destroy = () => animation.destroy();
      });
    };
    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);

    return () => {
      disposed = true;
      reducedMotion.removeEventListener("change", updateMotion);
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
      <div
        ref={containerRef}
        className="size-56 max-sm:size-44 motion-reduce:hidden"
        aria-hidden="true"
      />
      <span className="sr-only motion-reduce:not-sr-only motion-reduce:rounded-md motion-reduce:bg-card motion-reduce:px-4 motion-reduce:py-3 motion-reduce:text-sm">
        Cargando información…
      </span>
    </div>
  );
}
