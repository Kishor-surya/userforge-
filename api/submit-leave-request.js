import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { requireUser } from "./_requireUser.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const authUser = await requireUser(req, res, supabaseAdmin);
  if (!authUser) return;

  const { startDate, endDate, reason } = req.body || {};
  if (!startDate || !endDate || !reason || !String(reason).trim()) {
    res.status(400).json({ error: "startDate, endDate, and reason are all required." });
    return;
  }
  if (new Date(endDate) < new Date(startDate)) {
    res.status(400).json({ error: "End date must be on or after the start date." });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("full_name")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  const { data: created, error } = await supabaseAdmin
    .from("leave_requests")
    .insert({
      requester_auth_user_id: authUser.id,
      requester_email: authUser.email,
      requester_name: profile?.full_name || authUser.email,
      start_date: startDate,
      end_date: endDate,
      reason: String(reason).trim(),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ request: created });
}
