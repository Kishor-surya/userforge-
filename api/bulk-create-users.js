import { requireAdmin } from "./_adminAuth.js";
import { createUserWithInvite } from "./_userCreation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  const results = [];

  for (const row of rows) {
    // Sequential on purpose: Supabase Auth admin calls shouldn't be fired
    // with unbounded concurrency from a single request.
    // eslint-disable-next-line no-await-in-loop
    const result = await createUserWithInvite(row);
    results.push({
      email: row.email,
      ok: result.ok,
      error: result.ok ? null : result.error,
      emailSent: result.ok ? result.emailSent : false,
    });
  }

  const created = results.filter((r) => r.ok).length;
  const emailsSent = results.filter((r) => r.emailSent).length;

  res.status(200).json({ created, emailsSent, results });
}
