import type { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/auth.js';

export async function registerCheckRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/checks/:serverId?limit=100&offset=0
  app.get('/:serverId', async (request) => {
    const { serverId } = request.params as { serverId: string };
    const { limit = '100', offset = '0' } = request.query as Record<string, string>;
    const [checks, total] = await Promise.all([
      app.prisma.check.findMany({
        where: { serverId },
        orderBy: { checkedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      app.prisma.check.count({ where: { serverId } }),
    ]);
    return { checks, total };
  });
}
