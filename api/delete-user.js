import { requireAdmin } from "./_adminAuth.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.body || {};
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing } = await supabaseAdmin.from("users").select("auth_user_id").eq("id", id).maybeSingle();

  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Best-effort: also remove their Supabase Auth account so they can no
  // longer sign in once removed from the roster.
  if (existing?.auth_user_id) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(existing.auth_user_id);
    } catch {
      // Non-fatal -- the business row is already gone either way.
    }
  }

  res.status(200).json({ ok: true });
}
