import { requireAdmin } from "./_adminAuth.js";
import { createUserWithInvite } from "./_userCreation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const result = await createUserWithInvite(req.body || {});
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(200).json({ user: result.user, emailSent: result.emailSent, emailError: result.emailError });
}
