const nodemailer = require('nodemailer');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // No SMTP configured: use a free Ethereal test inbox for development
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const mailer = await getTransporter();
  const info = await mailer.sendMail({
    from: process.env.MAIL_FROM || 'TaskFlow <no-reply@taskflow.local>',
    to,
    subject,
    text,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Email preview:', preview);
}

module.exports = { sendMail };