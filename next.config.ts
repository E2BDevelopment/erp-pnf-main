import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Libraries that ship Node-oriented builds should stay out of the bundle
  // when they are used from server code.
  serverExternalPackages: ["xlsx"],
  allowedDevOrigins: ["192.168.56.1"],
};

export default nextConfig;
