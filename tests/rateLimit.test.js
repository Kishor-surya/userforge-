import { describe, expect, it } from "vitest";

import { checkAdminLoginRateLimit, getClientIp } from "../api/_rateLimit.js";

describe("getClientIp", () => {
  it("takes the first address from x-forwarded-for", () => {
    const req = { headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" } };
    expect(getClientIp(req)).toBe("203.0.113.4");
  });

  it("falls back to the socket remote address", () => {
    const req = { headers: {}, socket: { remoteAddress: "127.0.0.1" } };
    expect(getClientIp(req)).toBe("127.0.0.1");
  });

  it("falls back to 'unknown' when nothing is available", () => {
    const req = { headers: {}, socket: {} };
    expect(getClientIp(req)).toBe("unknown");
  });
});

function makeSupabaseStub({ count, error }) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    gte: () => Promise.resolve({ count, error }),
  };
  return { from: () => builder };
}

describe("checkAdminLoginRateLimit", () => {
  it("allows the request when under the failed-attempt threshold", async () => {
    const supabaseAdmin = makeSupabaseStub({ count: 2, error: null });
    const result = await checkAdminLoginRateLimit(supabaseAdmin, "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("blocks the request once the failed-attempt threshold is reached", async () => {
    const supabaseAdmin = makeSupabaseStub({ count: 5, error: null });
    const result = await checkAdminLoginRateLimit(supabaseAdmin, "1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("fails open (allows the request) if the lookup itself errors", async () => {
    const supabaseAdmin = makeSupabaseStub({ count: null, error: new Error("db down") });
    const result = await checkAdminLoginRateLimit(supabaseAdmin, "1.2.3.4");
    expect(result.allowed).toBe(true);
  });
});
