import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || (process.env.EMAIL_USER ? 'smtp.gmail.com' : '');
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER || process.env.EMAIL_USER
      ? {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        }
      : undefined,
  });
  return transporter;
}

export async function sendEmail({ to, subject, body, html }) {
  const t = getTransporter();
  if (!t) {
    // No SMTP configured — log instead so local dev / first deploy still works.
    console.log(`\n[mailer] (SMTP not configured, logging instead)\nTo: ${to}\nSubject: ${subject}\n${body}\n`);
    return { simulated: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || `RentAlls <${process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@rentalls.com'}>`,
    to,
    subject,
    text: body,
    html: html || undefined,
  });
}
