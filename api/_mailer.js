import nodemailer from "nodemailer";

export function buildWelcomeEmail({ email, fullName, department, role }, senderEmail) {
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

/**
 * The email sent to a newly-created user: their department/role, plus a
 * Supabase Auth magic-link so they can sign in and set their own password.
 * No password is ever generated, logged, or transmitted by this app.
 */
export function buildInviteEmail({ email, fullName, department, role, inviteLink }, senderEmail) {
  const text =
    `Hi ${fullName},\n\n` +
    "You have been added to UserForge with the following details:\n\n" +
    `Department: ${department}\n` +
    `Role: ${role}\n\n` +
    `Set up your account and sign in here (link expires soon, so use it promptly):\n${inviteLink}\n\n` +
    "You will be asked to set your own password when you follow the link. Once " +
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
      </table>
      <p style="margin-top:1rem;">
        <a href="${inviteLink}" style="background:linear-gradient(90deg,#f97316,#ec4899);color:white;
           padding:0.6rem 1.2rem;border-radius:8px;text-decoration:none;display:inline-block;">
          Set up your account
        </a>
      </p>
      <p style="color:#6b7280; font-size: 0.85em;">
        This link expires soon. You'll set your own password when you follow it — nobody at UserForge
        ever sees or stores it. Once signed in you'll see the other users in your department.
      </p>
      <p style="color:#6b7280; font-size: 0.85em;">If you believe this was a mistake, please contact your administrator.</p>
    </div>
  `;

  return {
    from: senderEmail,
    to: email,
    subject: "You've been added to UserForge — set up your account",
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

export async function sendWelcomeEmail({ email, fullName, department, role }) {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER;
  await transporter.sendMail(buildWelcomeEmail({ email, fullName, department, role }, senderEmail));
}

export async function sendInviteEmail({ email, fullName, department, role, inviteLink }) {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER;
  await transporter.sendMail(buildInviteEmail({ email, fullName, department, role, inviteLink }, senderEmail));
}
