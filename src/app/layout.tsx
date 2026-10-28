import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ERP PNF — ERP para empresas constructoras",
  description:
    "Sistema ERP en español para empresas constructoras: obras, requisiciones, nómina, tesorería y más.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deja que la app use el área bajo el notch: sin esto, `env(safe-area-inset-*)`
  // vale siempre 0 y el padding de la barra inferior no protege el home indicator.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
        </Providers>
      </body>
    </html>
  );
}
