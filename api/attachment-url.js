import { verifyAdminToken } from "./_adminAuth.js";
import { ATTACHMENT_BUCKET } from "./_attachments.js";
import { requireUser } from "./_requireUser.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id } = req.query || {};
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: request, error } = await supabaseAdmin
    .from("provisioning_requests")
    .select("id, requester_auth_user_id, attachment_path, attachment_filename")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!request || !request.attachment_path) {
    res.status(404).json({ error: "No attachment found for this request." });
    return;
  }

  const adminToken = req.headers["x-admin-token"];
  const isAdmin = Boolean(adminToken) && verifyAdminToken(adminToken);

  if (!isAdmin) {
    const authUser = await requireUser(req, res, supabaseAdmin);
    if (!authUser) return;
    if (authUser.id !== request.requester_auth_user_id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(request.attachment_path, 300);

  if (signError) {
    res.status(500).json({ error: signError.message });
    return;
  }

  res.status(200).json({ url: signed.signedUrl, filename: request.attachment_filename });
}
