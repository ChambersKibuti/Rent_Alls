import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
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
    from: process.env.SMTP_FROM || 'RentAlls <no-reply@rentalls.com>',
    to,
    subject,
    text: body,
    html: html || undefined,
  });
}
