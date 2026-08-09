import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { sendWelcomeEmail } from "./_mailer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { email, fullName, department, role } = req.body || {};
  if (!email || !fullName) {
    res.status(400).json({ error: "email and fullName are required" });
    return;
  }

  // Anti-abuse: only send if a matching row actually exists in the users
  // table (i.e. this really was just created by the app), rather than
  // letting this endpoint act as an open relay to arbitrary addresses.
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "No matching user found for this email." });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: `Could not verify user: ${err.message}` });
    return;
  }

  try {
    await sendWelcomeEmail({ email, fullName, department, role });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message || "Failed to send email" });
  }
}
