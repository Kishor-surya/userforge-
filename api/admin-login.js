import { timingSafeEqual } from "node:crypto";

import { issueAdminToken } from "./_adminAuth.js";

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

  const { username, password } = req.body || {};
  if (username !== "admin" || !password || !safeEqual(password, adminPassword)) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  res.status(200).json({ token: issueAdminToken() });
}
