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
