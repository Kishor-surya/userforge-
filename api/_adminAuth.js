import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured on the server.");
  }
  return secret;
}

function sign(payloadB64) {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

/** Issues a short-lived, stateless, HMAC-signed admin session token. */
export function issueAdminToken() {
  const payload = { admin: true, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Verifies a token from the X-Admin-Token header. Returns true/false. */
export function verifyAdminToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;

  const [payloadB64, signature] = token.split(".");
  let expectedSignature;
  try {
    expectedSignature = sign(payloadB64);
  } catch {
    return false;
  }

  const a = Buffer.from(signature || "", "utf-8");
  const b = Buffer.from(expectedSignature, "utf-8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    return payload.admin === true && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res) {
  const token = req.headers["x-admin-token"];
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
