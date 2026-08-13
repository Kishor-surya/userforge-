const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Vercel functions are stateless per-invocation, so an in-memory counter
 * wouldn't persist across requests -- this backs the rate limit with a
 * Supabase table instead (see migration_005_admin_rate_limit_and_email_log.sql).
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/** Returns { allowed, retryAfterSeconds }. Fails open on a lookup error, so a DB
 * hiccup can't lock every admin out. */
export async function checkAdminLoginRateLimit(supabaseAdmin, ip) {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("admin_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("succeeded", false)
    .gte("attempted_at", windowStart);

  if (error) {
    return { allowed: true };
  }
  if ((count ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: WINDOW_MINUTES * 60 };
  }
  return { allowed: true };
}

export async function recordAdminLoginAttempt(supabaseAdmin, ip, succeeded) {
  try {
    await supabaseAdmin.from("admin_login_attempts").insert({ ip, succeeded });
  } catch {
    // Best-effort logging -- never let this break the actual login flow.
  }
}
