import { createUserWithInvite, deleteUserByEmail } from "./_userCreation.js";

/**
 * Called only by .github/workflows/user-request-sync.yml, authenticated
 * with a shared secret. The Action itself verifies the issue author is a
 * repo owner/member/collaborator before ever calling this.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = req.headers["x-internal-secret"];
  if (!process.env.INTERNAL_API_SECRET || secret !== process.env.INTERNAL_API_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body || {};

  if (body.type === "delete") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }
    const result = await deleteUserByEmail(email);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(200).json({ ok: true, deleted: email });
    return;
  }

  if (body.type === "create") {
    const result = await createUserWithInvite(body);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(200).json({ ok: true, user: result.user, emailSent: result.emailSent, emailError: result.emailError });
    return;
  }

  res.status(400).json({ error: "body.type must be 'create' or 'delete'" });
}
