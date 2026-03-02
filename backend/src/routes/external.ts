import type { FastifyInstance } from 'fastify';
import { authenticateApiKey } from '../hooks/apikey.js';

export async function registerExternalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateApiKey);

  // GET /api/v1/servers — list all servers with current status
  app.get('/servers', async (request) => {
    const servers = await app.prisma.server.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        url: true,
        checkType: true,
        status: true,
        intervalSec: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return { servers, total: servers.length };
  });

  // GET /api/v1/servers/:id — single server detail
  app.get('/servers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const server = await app.prisma.server.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        checkType: true,
        status: true,
        intervalSec: true,
        degradedThresholdMs: true,
        enabled: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!server) {
      return reply.status(404).send({ error: 'Servidor no encontrado' });
    }

    // Last check
    const lastCheck = await app.prisma.check.findFirst({
      where: { serverId: id },
      orderBy: { checkedAt: 'desc' },
      select: {
        status: true,
        responseTimeMs: true,
        statusCode: true,
        checkedAt: true,
      },
    });

    // Active incident
    const activeIncident = await app.prisma.incident.findFirst({
      where: { serverId: id, resolvedAt: null },
      select: { id: true, status: true, startedAt: true },
    });

    return { ...server, lastCheck, activeIncident };
  });

  // GET /api/v1/servers/:id/checks — check history (paginated)
  app.get('/servers/:id/checks', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };

    const server = await app.prisma.server.findUnique({ where: { id }, select: { id: true } });
    if (!server) {
      return reply.status(404).send({ error: 'Servidor no encontrado' });
    }

    const take = Math.min(Number(limit) || 50, 200);
    const skip = Number(offset) || 0;

    const [checks, total] = await Promise.all([
      app.prisma.check.findMany({
        where: { serverId: id },
        orderBy: { checkedAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          status: true,
          responseTimeMs: true,
          statusCode: true,
          errorMessage: true,
          checkedAt: true,
        },
      }),
      app.prisma.check.count({ where: { serverId: id } }),
    ]);

    return { checks, total, limit: take, offset: skip };
  });

  // GET /api/v1/servers/:id/incidents — incident history (paginated + filters)
  app.get('/servers/:id/incidents', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as {
      limit?: string;
      offset?: string;
      from?: string;
      to?: string;
      status?: string;
    };

    const server = await app.prisma.server.findUnique({ where: { id }, select: { id: true } });
    if (!server) {
      return reply.status(404).send({ error: 'Servidor no encontrado' });
    }

    const take = Math.min(Number(query.limit) || 50, 200);
    const skip = Number(query.offset) || 0;

    const where: any = { serverId: id };

    if (query.from || query.to) {
      where.startedAt = {};
      if (query.from) where.startedAt.gte = new Date(query.from);
      if (query.to) where.startedAt.lte = new Date(query.to);
    }

    if (query.status) {
      where.status = query.status;
    }

    const [incidents, total] = await Promise.all([
      app.prisma.incident.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          status: true,
          startedAt: true,
          resolvedAt: true,
          durationMs: true,
        },
      }),
      app.prisma.incident.count({ where }),
    ]);

    return { incidents, total, limit: take, offset: skip };
  });

  // GET /api/v1/stats — overall statistics
  app.get('/stats', async (request) => {
    const query = request.query as { from?: string; to?: string };

    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();
    const periodMs = to.getTime() - from.getTime();

    const servers = await app.prisma.server.findMany({
      where: { enabled: true },
      select: { id: true, name: true, status: true, checkType: true },
    });

    const stats = await Promise.all(
      servers.map(async (server) => {
        const incidents = await app.prisma.incident.findMany({
          where: {
            serverId: server.id,
            startedAt: { gte: from, lte: to },
          },
        });

        const totalDowntimeMs = incidents.reduce((sum, inc) => {
          if (inc.durationMs) return sum + inc.durationMs;
          if (!inc.resolvedAt) return sum + (Date.now() - inc.startedAt.getTime());
          return sum;
        }, 0);

        const uptimePercent = Math.max(
          0,
          Math.round(((periodMs - totalDowntimeMs) / periodMs) * 10000) / 100
        );

        const recentChecks = await app.prisma.check.findMany({
          where: { serverId: server.id, checkedAt: { gte: from, lte: to } },
          select: { responseTimeMs: true },
          orderBy: { checkedAt: 'desc' },
          take: 100,
        });

        const responseTimes = recentChecks
          .map((c) => c.responseTimeMs)
          .filter((t): t is number => t !== null);

        const avgResponseMs =
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : null;

        const activeIncident = await app.prisma.incident.findFirst({
          where: { serverId: server.id, resolvedAt: null },
        });

        return {
          serverId: server.id,
          name: server.name,
          status: server.status,
          checkType: server.checkType,
          uptimePercent,
          avgResponseMs,
          incidentCount: incidents.length,
          totalDowntimeMs,
          activeIncident: activeIncident
            ? { status: activeIncident.status, startedAt: activeIncident.startedAt }
            : null,
        };
      })
    );

    return {
      stats,
      period: { from: from.toISOString(), to: to.toISOString() },
      generatedAt: new Date().toISOString(),
    };
  });
}
