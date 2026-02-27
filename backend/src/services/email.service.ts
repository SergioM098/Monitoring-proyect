import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function initEmail(): void {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[Email] Faltan variables SMTP_HOST, SMTP_USER o SMTP_PASS en .env');
    console.warn('[Email] Las notificaciones por email estaran deshabilitadas.');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  transporter.verify()
    .then(() => console.log('[Email] SMTP conectado y listo para enviar'))
    .catch((err) => console.error('[Email] Error verificando SMTP:', err.message));
}

export function isEmailReady(): boolean {
  return transporter !== null;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!transporter) {
    throw new Error('Email transport not configured. Check SMTP settings in .env');
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: body,
  });
}
