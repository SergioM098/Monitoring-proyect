import type { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../hooks/auth.js';

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/notifications/:serverId
  app.get('/:serverId', async (request) => {
    const { serverId } = request.params as { serverId: string };
    return app.prisma.notification.findMany({ where: { serverId } });
  });

  // POST /api/notifications (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as {
      serverId: string;
      destination: string;
      type?: string;
      triggerOn?: string;
    };
    const notif = await app.prisma.notification.create({
      data: {
        serverId: body.serverId,
        destination: body.destination,
        type: body.type || 'whatsapp',
        triggerOn: body.triggerOn || 'down',
      },
    });
    return reply.status(201).send(notif);
  });

  // DELETE /api/notifications/:id (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.notification.delete({ where: { id } });
    return reply.status(204).send();
  });
}
