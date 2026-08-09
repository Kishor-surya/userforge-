import { verifyAdminToken } from "./_adminAuth.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { event } = req.body || {};
  if (event !== "login" && event !== "logout") {
    res.status(400).json({ error: "event must be 'login' or 'logout'" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  let userEmail = null;

  const adminToken = req.headers["x-admin-token"];
  if (adminToken && verifyAdminToken(adminToken)) {
    userEmail = "admin";
  } else {
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!accessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    // Verify the token server-side rather than trusting a client-supplied
    // email -- the caller only gets to log an event for themselves.
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    userEmail = data.user.email;
  }

  const { error: insertError } = await supabaseAdmin.from("login_audit").insert({ user_email: userEmail, event });
  if (insertError) {
    res.status(500).json({ error: insertError.message });
    return;
  }

  res.status(200).json({ ok: true });
}
