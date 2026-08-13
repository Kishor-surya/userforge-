import { logEmail } from "./_emailLog.js";
import { generateRandomPassword } from "./_password.js";
import { getSupabaseAdmin } from "./_supabaseAdmin.js";
import { sendActivationEmail } from "./_mailer.js";
import { normalizeCreatePayload } from "./_validation.js";

/**
 * Creates a user: validates input, creates a Supabase Auth identity with a
 * randomly-generated temporary password, generates a one-time activation
 * (password-recovery) link, inserts the business row linked to that auth
 * identity, and emails both the temp password and the activation link.
 * Shared by api/create-user.js (admin UI), api/bulk-create-users.js, and
 * api/github-user-request.js so all three creation paths behave identically.
 */
export async function createUserWithInvite(rawPayload) {
  const { data, errors } = normalizeCreatePayload(rawPayload);
  if (errors.length > 0) {
    return { ok: false, status: 400, error: errors.join(" ") };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", data.email).maybeSingle();
  if (existing) {
    return { ok: false, status: 409, error: `A user with email ${data.email} already exists.` };
  }

  const tempPassword = generateRandomPassword();
  let authUserId = null;
  let activationLink = null;
  try {
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
    });
    if (createError) throw createError;
    authUserId = authData?.user?.id || null;

    const redirectTo = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") + "/" : undefined;
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (linkError) throw linkError;
    activationLink = linkData?.properties?.action_link || null;
  } catch (err) {
    return { ok: false, status: 502, error: `Could not create login access: ${err.message}` };
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      age: data.age,
      department: data.department,
      role: data.role,
      status: data.status,
      auth_user_id: authUserId,
    })
    .select()
    .single();

  if (insertError) {
    return { ok: false, status: 500, error: insertError.message };
  }

  let emailSent = false;
  let emailError = null;
  if (activationLink) {
    try {
      await sendActivationEmail({
        email: data.email,
        fullName: data.fullName,
        department: data.department,
        role: data.role,
        activationLink,
        tempPassword,
      });
      emailSent = true;
    } catch (err) {
      emailError = err.message;
    }
  } else {
    emailError = "No activation link was generated.";
  }

  await logEmail(supabaseAdmin, {
    recipient: data.email,
    emailType: "activation",
    sent: emailSent,
    error: emailError,
  });

  return { ok: true, status: 200, user: created, emailSent, emailError };
}

/** Deletes a user's business row and, best-effort, their Auth identity. */
export async function deleteUserByEmail(email) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing, error: findError } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (findError) return { ok: false, status: 500, error: findError.message };
  if (!existing) return { ok: false, status: 404, error: `No user found with email ${email}` };

  const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("id", existing.id);
  if (deleteError) return { ok: false, status: 500, error: deleteError.message };

  if (existing.auth_user_id) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(existing.auth_user_id);
    } catch {
      // Non-fatal: the business row is gone either way.
    }
  }

  return { ok: true, status: 200 };
}
