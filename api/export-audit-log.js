import { getSupabaseAdmin } from "./_supabaseAdmin.js";

/** Called only by .github/workflows/audit-log-export.yml, secret-authenticated. */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = req.headers["x-internal-secret"];
  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("login_audit")
    .select("*")
    .order("occurred_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ exportedAt: new Date().toISOString(), count: data.length, events: data });
}
