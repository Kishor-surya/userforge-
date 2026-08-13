import { timingSafeEqual } from "node:crypto";

import { issueAdminToken } from "./_adminAuth.js";
import { checkAdminLoginRateLimit, getClientIp, recordAdminLoginAttempt } from "./_rateLimit.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "Admin login is not configured on the server (ADMIN_PASSWORD)." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const ip = getClientIp(req);

  const { allowed, retryAfterSeconds } = await checkAdminLoginRateLimit(supabaseAdmin, ip);
  if (!allowed) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.status(429).json({ error: "Too many failed admin login attempts. Try again later." });
    return;
  }

  const { username, password } = req.body || {};
  const succeeded = username === "admin" && Boolean(password) && safeEqual(password, adminPassword);

  await recordAdminLoginAttempt(supabaseAdmin, ip, succeeded);

  if (!succeeded) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  res.status(200).json({ token: issueAdminToken() });
}
