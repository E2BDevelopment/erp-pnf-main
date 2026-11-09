import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Sin `nonce` aquí: según CSP, un nonce en style-src hace que se ignore
    // 'unsafe-inline' y bloquea los estilos que inyectan librerías en runtime
    // (Sonner, Radix, GSAP). Los scripts sí siguen protegidos con nonce.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `connect-src 'self' https: wss: http://127.0.0.1:54321 ws://127.0.0.1:54321${isDev ? " http://localhost:54321 http://192.168.100.18:54321 ws://192.168.100.18:54321 ws://localhost:3000 ws://127.0.0.1:3000" : ""}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
