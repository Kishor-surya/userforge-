import { requireAdmin } from "./_adminAuth.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { normalizeCreatePayload } from "./_validation.js";

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

  const { data, errors } = normalizeCreatePayload(req.body || {});
  if (errors.length > 0) {
    res.status(400).json({ error: errors.join(" ") });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", data.email)
    .neq("id", id)
    .maybeSingle();
  if (existing) {
    res.status(409).json({ error: `A user with email ${data.email} already exists.` });
    return;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      age: data.age,
      department: data.department,
      role: data.role,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ user: updated });
}
