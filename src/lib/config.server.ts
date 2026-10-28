import process from "node:process";

// Server-only config. `.server.ts` files are only imported from server code,
// so values here never reach the browser.
//
// Read process.env INSIDE a function or handler so values resolve per request.
// Use NEXT_PUBLIC_* variables for config that must be readable from the client.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Add server-only values here, e.g.:
    //   databaseUrl: process.env.DATABASE_URL,
    //   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}
