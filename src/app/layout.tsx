import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ERP PNF — ERP para empresas constructoras",
  description:
    "Sistema ERP en español para empresas constructoras: obras, requisiciones, nómina, tesorería y más.",
  icons: {
    icon: "/assets/img/icon-1.png",
    shortcut: "/assets/img/icon-1.png",
    apple: "/assets/img/icon-1.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#15181c" },
  ],
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
