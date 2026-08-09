import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { requireUser } from "./_requireUser.js";
import {
  ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_BYTES,
  isAllowedAttachmentType,
  isValidProvisioningCategory,
  sanitizeFilename,
} from "./_attachments.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const authUser = await requireUser(req, res, supabaseAdmin);
  if (!authUser) return;

  const { category, description, amountSpent, claimedAmount, fileBase64, fileName, fileType } = req.body || {};

  if (!isValidProvisioningCategory(category)) {
    res.status(400).json({ error: "Invalid category." });
    return;
  }

  const spent = Number(amountSpent);
  const claimed = Number(claimedAmount);
  if (!Number.isFinite(spent) || spent < 0 || !Number.isFinite(claimed) || claimed < 0) {
    res.status(400).json({ error: "amountSpent and claimedAmount must be valid non-negative numbers." });
    return;
  }

  let attachmentPath = null;
  let attachmentFilename = null;

  if (fileBase64) {
    if (!isAllowedAttachmentType(fileType)) {
      res.status(400).json({ error: `Unsupported file type: ${fileType}` });
      return;
    }

    let buffer;
    try {
      buffer = Buffer.from(fileBase64, "base64");
    } catch {
      res.status(400).json({ error: "Could not decode the uploaded file." });
      return;
    }
    if (buffer.length === 0 || buffer.length > MAX_ATTACHMENT_BYTES) {
      res.status(400).json({ error: "File is empty or too large (max 5MB)." });
      return;
    }

    const path = `${authUser.id}/${Date.now()}-${sanitizeFilename(fileName)}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, buffer, { contentType: fileType, upsert: false });
    if (uploadError) {
      res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      return;
    }

    attachmentPath = path;
    attachmentFilename = fileName;
  }

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("full_name")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  const { data: created, error } = await supabaseAdmin
    .from("provisioning_requests")
    .insert({
      requester_auth_user_id: authUser.id,
      requester_email: authUser.email,
      requester_name: profile?.full_name || authUser.email,
      category,
      description: description ? String(description).trim() : null,
      amount_spent: spent,
      claimed_amount: claimed,
      attachment_path: attachmentPath,
      attachment_filename: attachmentFilename,
    })
    .select()
    .single();

  if (error) {
    // Best-effort cleanup so we don't leave an orphaned file if the DB insert failed.
    if (attachmentPath) {
      await supabaseAdmin.storage.from(ATTACHMENT_BUCKET).remove([attachmentPath]).catch(() => {});
    }
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ request: created });
}
