import nodemailer from "nodemailer";

/**
 * The email sent to a newly-created user: their department/role, a
 * randomly-generated temporary password, and an activation link they should
 * use to sign in and immediately set their own password. The temp password
 * is generated server-side (api/_password.js) and never logged or stored
 * anywhere except as the user's initial Supabase Auth password.
 */
export function buildActivationEmail({ email, fullName, department, role, activationLink, tempPassword }, senderEmail) {
  const text =
    `Hi ${fullName},\n\n` +
    "You have been added to UserForge with the following details:\n\n" +
    `Department: ${department}\n` +
    `Role: ${role}\n\n` +
    `Your temporary password: ${tempPassword}\n\n` +
    `Activate your account and set a new password here (link expires soon, so use it promptly):\n${activationLink}\n\n` +
    "Please sign in and change this temporary password as soon as possible. Once " +
    "signed in you'll be able to see other users in your department.\n\n" +
    "If you believe this was a mistake, please contact your administrator.\n\n" +
    "Regards,\nUserForge Team";

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#1f2328;">
      <h2>Welcome, ${fullName}! 👋</h2>
      <p>You have been added to <strong>UserForge</strong> with the following details:</p>
      <table style="border-collapse: collapse;">
        <tr><td style="padding:4px 12px 4px 0;"><strong>Department</strong></td><td>${department}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Role</strong></td><td>${role}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;"><strong>Temporary password</strong></td>
            <td><code>${tempPassword}</code></td></tr>
      </table>
      <p style="margin-top:1rem;">
        <a href="${activationLink}" style="background:linear-gradient(90deg,#f97316,#ec4899);color:white;
           padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;display:inline-block;">
          Activate account &amp; set new password
        </a>
      </p>
      <p style="color:#6b7280; font-size: 0.85em;">
        This link expires soon. Please sign in and replace the temporary password above as soon as
        possible. Once signed in you'll see the other users in your department.
      </p>
      <p style="color:#6b7280; font-size: 0.85em;">If you believe this was a mistake, please contact your administrator.</p>
    </div>
  `;

  return {
    from: senderEmail,
    to: email,
    subject: "You've been added to UserForge — activate your account",
    text,
    html,
  };
}

function getTransporter() {
  const senderEmail = process.env.GMAIL_USER;
  const senderPassword = process.env.GMAIL_APP_PASSWORD;

  if (!senderEmail || !senderPassword) {
    throw new Error("Email is not configured on the server (GMAIL_USER / GMAIL_APP_PASSWORD).");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: senderEmail, pass: senderPassword },
  });
}

export async function sendActivationEmail({ email, fullName, department, role, activationLink, tempPassword }) {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER;
  await transporter.sendMail(
    buildActivationEmail({ email, fullName, department, role, activationLink, tempPassword }, senderEmail)
  );
}
