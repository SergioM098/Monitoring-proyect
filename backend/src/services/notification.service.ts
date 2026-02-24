import type { PrismaClient } from '../generated/prisma/client.js';
import type { Server as ServerModel } from '../generated/prisma/client.js';
import { sendWhatsAppMessage, isWhatsAppReady } from './whatsapp.service.js';

export async function sendAlert(
  server: ServerModel,
  alertStatus: 'down' | 'degraded',
  prisma: PrismaClient,
): Promise<void> {
  // Find notifications that match this alert type
  const triggerValues = alertStatus === 'down'
    ? ['down', 'both']
    : ['degraded', 'both'];

  const notifications = await prisma.notification.findMany({
    where: {
      serverId: server.id,
      enabled: true,
      type: 'whatsapp',
      triggerOn: { in: triggerValues },
    },
  });

  if (notifications.length === 0) return;

  if (!isWhatsAppReady()) {
    console.log(`[ALERT] Server "${server.name}" is ${alertStatus.toUpperCase()} - WhatsApp not connected, skipping`);
    return;
  }

  const title = alertStatus === 'down'
    ? '*ALERTA - Servidor Caido*'
    : '*ALERTA - Servidor Lento*';

  for (const notif of notifications) {
    const messageBody = [
      title,
      ``,
      `*Servidor:* ${server.name}`,
      `*URL:* ${server.url}`,
      `*Estado:* ${alertStatus.toUpperCase()}`,
      `*Detectado:* ${new Date().toLocaleString()}`,
      ``,
      `Revisa el dashboard para mas detalles.`,
    ].join('\n');

    try {
      await sendWhatsAppMessage(notif.destination, messageBody);
      await prisma.notificationLog.create({
        data: {
          serverId: server.id,
          destination: notif.destination,
          message: messageBody,
          success: true,
        },
      });
      console.log(`[WhatsApp] Alerta ${alertStatus} enviada a ${notif.destination} por servidor ${server.name}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      await prisma.notificationLog.create({
        data: {
          serverId: server.id,
          destination: notif.destination,
          message: messageBody,
          success: false,
          errorMessage: err.message ?? 'Unknown error',
        },
      });
      console.error(`[WhatsApp] Error enviando a ${notif.destination}:`, err.message);
    }
  }
}
