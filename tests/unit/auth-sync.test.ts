import { describe, expect, it } from "vitest";
import { shouldRefreshAuthRoute } from "@/lib/auth/should-refresh-auth-route";

describe("shouldRefreshAuthRoute", () => {
  it("does not refresh when Supabase re-emits SIGNED_IN for the current user", () => {
    expect(shouldRefreshAuthRoute("SIGNED_IN", "user-1", "user-1")).toBe(false);
  });

  it("refreshes when a different user signs in", () => {
    expect(shouldRefreshAuthRoute("SIGNED_IN", "user-2", "user-1")).toBe(true);
  });

  it("does not refresh for a token renewal", () => {
    expect(shouldRefreshAuthRoute("TOKEN_REFRESHED", "user-1", "user-1")).toBe(false);
  });

  it("refreshes after sign out", () => {
    expect(shouldRefreshAuthRoute("SIGNED_OUT", null, "user-1")).toBe(true);
  });
});
