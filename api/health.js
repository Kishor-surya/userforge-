export default function handler(req, res) {
  const emailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  res.status(200).json({
    ok: true,
    emailConfigured,
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  });
}
