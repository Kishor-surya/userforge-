/**
 * Best-effort structured log of every email delivery attempt, so it can be
 * charted in Grafana (see observability/) instead of only ever showing up
 * as a one-off alert in the admin UI.
 */
export async function logEmail(supabaseAdmin, { recipient, emailType, sent, error }) {
  try {
    await supabaseAdmin.from("email_log").insert({
      recipient,
      email_type: emailType,
      sent,
      error: error || null,
    });
  } catch {
    // Never let logging itself break the actual request.
  }
}
