import type { PrismaClient } from '../generated/prisma/client.js';
import type { Server as ServerModel } from '../generated/prisma/client.js';
import { sendEmail, isEmailReady } from './email.service.js';

export async function sendAlert(
  server: ServerModel,
  alertStatus: 'down' | 'degraded',
  prisma: PrismaClient,
): Promise<void> {
  const triggerValues = alertStatus === 'down'
    ? ['down', 'both']
    : ['degraded', 'both'];

  const notifications = await prisma.notification.findMany({
    where: {
      serverId: null,
      enabled: true,
      triggerOn: { in: triggerValues },
    },
  });

  if (notifications.length === 0) return;

  if (!isEmailReady()) {
    console.log(`[ALERT] Server "${server.name}" is ${alertStatus.toUpperCase()} - Email not configured, skipping`);
    return;
  }

  const statusLabel = alertStatus === 'down' ? 'CAIDO' : 'LENTO';
  const statusColor = alertStatus === 'down' ? '#ef4444' : '#eab308';

  const subject = `[ALERTA] ${server.name} - ${statusLabel}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px;">
      <div style="background: ${statusColor}; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
        <strong>ALERTA - Servidor ${statusLabel}</strong>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
        <p style="margin: 4px 0;"><strong>Servidor:</strong> ${server.name}</p>
        <p style="margin: 4px 0;"><strong>URL:</strong> ${server.url}</p>
        <p style="margin: 4px 0;"><strong>Estado:</strong> ${statusLabel}</p>
        <p style="margin: 4px 0;"><strong>Detectado:</strong> ${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">
        <p style="color: #6b7280; font-size: 13px;">Revisa el dashboard para mas detalles.</p>
      </div>
    </div>
  `;

  for (const notif of notifications) {
    try {
      await sendEmail(notif.destination, subject, html);
      await prisma.notificationLog.create({
        data: {
          serverId: server.id,
          destination: notif.destination,
          message: subject,
          success: true,
        },
      });
      console.log(`[Email] Alerta ${alertStatus} enviada a ${notif.destination} por servidor ${server.name}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      await prisma.notificationLog.create({
        data: {
          serverId: server.id,
          destination: notif.destination,
          message: subject,
          success: false,
          errorMessage: err.message ?? 'Unknown error',
        },
      });
      console.error(`[Email] Error enviando a ${notif.destination}:`, err.message);
    }
  }
}
