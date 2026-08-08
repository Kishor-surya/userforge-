/**
 * Calls the /api/send-welcome-email serverless function. Returns
 * { sent: boolean, error?: string } rather than throwing, so callers can
 * show a non-blocking warning if email delivery fails.
 */
export async function sendWelcomeEmail({ email, fullName, department, role }) {
  try {
    const response = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName, department, role }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { sent: false, error: body.error || `Request failed with status ${response.status}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}
