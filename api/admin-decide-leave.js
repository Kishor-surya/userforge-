import { requireAdmin } from "./_adminAuth.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { id, decision, reason } = req.body || {};
  if (!id || !["approved", "rejected"].includes(decision)) {
    res.status(400).json({ error: "id and a valid decision ('approved' or 'rejected') are required." });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .update({ status: decision, admin_reason: reason || null, decided_at: now, updated_at: now })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ request: data });
}
