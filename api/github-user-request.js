import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { sendWelcomeEmail } from "./_mailer.js";

const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Support"];
const ROLES = ["Admin", "Manager", "Employee", "Contractor", "Intern"];
const STATUSES = ["Active", "Inactive"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Called only by the .github/workflows/user-request-sync.yml GitHub Action
 * (never by the browser), authenticated with a shared secret. The Action
 * itself is responsible for verifying the issue author is a repo
 * owner/collaborator before ever calling this.
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
  const supabaseAdmin = getSupabaseAdmin();

  if (body.type === "delete") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const { data: existing, error: findError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (findError) {
      res.status(500).json({ error: findError.message });
      return;
    }
    if (!existing) {
      res.status(404).json({ error: `No user found with email ${email}` });
      return;
    }

    const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("id", existing.id);
    if (deleteError) {
      res.status(500).json({ error: deleteError.message });
      return;
    }

    res.status(200).json({ ok: true, deleted: email });
    return;
  }

  if (body.type === "create") {
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const ageRaw = String(body.age || "").trim();
    const age = ageRaw && !Number.isNaN(Number(ageRaw)) ? parseInt(ageRaw, 10) : 0;

    let department = String(body.department || "").trim();
    if (!DEPARTMENTS.includes(department)) department = DEPARTMENTS[0];

    let role = String(body.role || "").trim();
    if (!ROLES.includes(role)) role = ROLES[0];

    let status = String(body.status || "").trim();
    if (!STATUSES.includes(status)) status = "Active";

    if (!fullName || !email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "A valid fullName and email are required." });
      return;
    }

    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      res.status(409).json({ error: `A user with email ${email} already exists.` });
      return;
    }

    const { data: created, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({ full_name: fullName, email, phone, age, department, role, status })
      .select()
      .single();
    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    let emailSent = false;
    let emailError = null;
    try {
      await sendWelcomeEmail({ email, fullName, department, role });
      emailSent = true;
    } catch (err) {
      emailError = err.message;
    }

    res.status(200).json({ ok: true, user: created, emailSent, emailError });
    return;
  }

  res.status(400).json({ error: "body.type must be 'create' or 'delete'" });
}
