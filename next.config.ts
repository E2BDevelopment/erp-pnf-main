import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El indicador flotante de desarrollo tapaba la barra lateral en las
  // revisiones visuales. Los errores de compilación siguen mostrándose.
  devIndicators: false,
  // Libraries that ship Node-oriented builds should stay out of the bundle
  // when they are used from server code.
  serverExternalPackages: ["xlsx"],
  allowedDevOrigins: ["172.25.112.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
