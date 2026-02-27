import type { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../hooks/auth.js';

export async function registerNotificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/notifications — all global notifications (serverId is null)
  app.get('/', async () => {
    return app.prisma.notification.findMany({
      where: { serverId: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  // POST /api/notifications (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as {
      destination: string;
      type?: string;
      triggerOn?: string;
    };
    const notif = await app.prisma.notification.create({
      data: {
        destination: body.destination,
        type: body.type || 'email',
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
