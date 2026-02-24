import type { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/auth.js';

export async function registerIncidentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/incidents?serverId=&from=&to=&status=&limit=&offset=
  app.get('/', async (request) => {
    const query = request.query as {
      serverId?: string;
      from?: string;
      to?: string;
      status?: string;
      limit?: string;
      offset?: string;
    };

    const where: Record<string, unknown> = {};
    if (query.serverId) where.serverId = query.serverId;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.startedAt = {};
      if (query.from) (where.startedAt as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.startedAt as Record<string, unknown>).lte = new Date(query.to);
    }

    const [incidents, total] = await Promise.all([
      app.prisma.incident.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: parseInt(query.limit || '50'),
        skip: parseInt(query.offset || '0'),
        include: {
          server: { select: { id: true, name: true, url: true } },
        },
      }),
      app.prisma.incident.count({ where }),
    ]);

    return { incidents, total };
  });

  // GET /api/incidents/stats?from=&to=
  app.get('/stats', async (request) => {
    const query = request.query as { from?: string; to?: string };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : new Date();

    const servers = await app.prisma.server.findMany({
      where: { enabled: true },
      select: { id: true, name: true },
    });

    const stats = await Promise.all(
      servers.map(async (server) => {
        const incidents = await app.prisma.incident.findMany({
          where: {
            serverId: server.id,
            startedAt: { gte: from, lte: to },
          },
        });

        const totalDowntimeMs = incidents.reduce((sum, inc) => sum + (inc.durationMs ?? 0), 0);
        const periodMs = to.getTime() - from.getTime();
        const uptimePercent = periodMs > 0
          ? Math.max(0, ((periodMs - totalDowntimeMs) / periodMs) * 100)
          : 100;

        return {
          serverId: server.id,
          serverName: server.name,
          incidentCount: incidents.length,
          totalDowntimeMs,
          uptimePercent: Math.round(uptimePercent * 100) / 100,
          activeIncident: incidents.find((i) => !i.resolvedAt) ?? null,
        };
      })
    );

    return { stats, from: from.toISOString(), to: to.toISOString() };
  });
}
