import nodemailer from "nodemailer";

function buildEmail({ email, fullName, department, role }, senderEmail) {
  const text =
    `Hi ${fullName},\n\n` +
    "You have been added to UserForge with the following details:\n\n" +
    `Department: ${department}\n` +
    `Role: ${role}\n\n` +
    "If you believe this was a mistake, please contact your administrator.\n\n" +
    "Regards,\nUserForge Team";

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2328;">
      <h2>Welcome, ${fullName}! 👋</h2>
      <p>You have been added to <strong>UserForge</strong> with the following details:</p>
      <table style="border-collapse: collapse;">
        <tr><td style="padding:4px 12px 4px 0;"><strong>Department</strong></td><td>${department}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Role</strong></td><td>${role}</td></tr>
      </table>
      <p>If you believe this was a mistake, please contact your administrator.</p>
      <p style="color:#6b7280; font-size: 0.85em;">This is an automated message from UserForge.</p>
    </div>
  `;

  return {
    from: senderEmail,
    to: email,
    subject: "You've been added to UserForge",
    text,
    html,
  };
}

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

  const senderEmail = process.env.GMAIL_USER;
  const senderPassword = process.env.GMAIL_APP_PASSWORD;

  if (!senderEmail || !senderPassword) {
    res.status(500).json({ error: "Email is not configured on the server (GMAIL_USER / GMAIL_APP_PASSWORD)." });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: senderEmail, pass: senderPassword },
  });

  try {
    await transporter.sendMail(buildEmail({ email, fullName, department, role }, senderEmail));
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message || "Failed to send email" });
  }
}
