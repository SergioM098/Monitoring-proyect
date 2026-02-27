import type { FastifyInstance } from 'fastify';

export async function registerStatusRoutes(app: FastifyInstance) {
  // GET /api/status/public — NO auth required
  app.get('/public', async () => {
    const servers = await app.prisma.server.findMany({
      where: { isPublic: true, enabled: true },
      select: { id: true, name: true, status: true, checkType: true },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodMs = Date.now() - thirtyDaysAgo.getTime();

    const serversWithStats = await Promise.all(
      servers.map(async (server) => {
        // Uptime percentage from incidents
        const incidents = await app.prisma.incident.findMany({
          where: {
            serverId: server.id,
            startedAt: { gte: thirtyDaysAgo },
          },
        });

        const totalDowntimeMs = incidents.reduce((sum, inc) => {
          if (inc.durationMs) return sum + inc.durationMs;
          // Active incident — count from start to now
          if (!inc.resolvedAt) return sum + (Date.now() - inc.startedAt.getTime());
          return sum;
        }, 0);

        const uptimePercent = Math.max(0, Math.round(((periodMs - totalDowntimeMs) / periodMs) * 10000) / 100);

        // Average response time (last 50 checks)
        const recentChecks = await app.prisma.check.findMany({
          where: { serverId: server.id },
          orderBy: { checkedAt: 'desc' },
          take: 50,
          select: { responseTimeMs: true },
        });

        const responseTimes = recentChecks
          .map((c) => c.responseTimeMs)
          .filter((t): t is number => t !== null);
        const avgResponseMs = responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null;

        // Active incident (only show if server is currently not up)
        const activeIncident = server.status !== 'up'
          ? incidents.find((i) => !i.resolvedAt) ?? null
          : null;

        return {
          ...server,
          uptimePercent,
          avgResponseMs,
          activeIncident: activeIncident
            ? { status: activeIncident.status, startedAt: activeIncident.startedAt }
            : null,
        };
      })
    );

    // Overall status
    const allUp = serversWithStats.every((s) => s.status === 'up');
    const anyDown = serversWithStats.some((s) => s.status === 'down');

    return {
      overallStatus: anyDown ? 'issues' : allUp ? 'operational' : 'degraded',
      servers: serversWithStats,
      generatedAt: new Date().toISOString(),
    };
  });

  // GET /api/status/public/:slug — single server status, NO auth
  app.get('/public/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const server = await app.prisma.server.findUnique({
      where: { publicSlug: slug },
      select: { id: true, name: true, status: true, checkType: true, isPublic: true, enabled: true },
    });

    if (!server || !server.isPublic || !server.enabled) {
      return reply.status(404).send({ error: 'Pagina no encontrada' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodMs = Date.now() - thirtyDaysAgo.getTime();

    const incidents = await app.prisma.incident.findMany({
      where: { serverId: server.id, startedAt: { gte: thirtyDaysAgo } },
      orderBy: { startedAt: 'desc' },
    });

    const totalDowntimeMs = incidents.reduce((sum, inc) => {
      if (inc.durationMs) return sum + inc.durationMs;
      if (!inc.resolvedAt) return sum + (Date.now() - inc.startedAt.getTime());
      return sum;
    }, 0);

    const uptimePercent = Math.max(0, Math.round(((periodMs - totalDowntimeMs) / periodMs) * 10000) / 100);

    const recentChecks = await app.prisma.check.findMany({
      where: { serverId: server.id },
      orderBy: { checkedAt: 'desc' },
      take: 50,
      select: { id: true, status: true, responseTimeMs: true, statusCode: true, checkedAt: true },
    });

    const responseTimes = recentChecks
      .map((c) => c.responseTimeMs)
      .filter((t): t is number => t !== null);
    const avgResponseMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

    const activeIncident = server.status !== 'up'
      ? incidents.find((i) => !i.resolvedAt) ?? null
      : null;

    const incidentHistory = incidents
      .filter((i) => i.resolvedAt)
      .slice(0, 10)
      .map((i) => ({
        status: i.status,
        startedAt: i.startedAt,
        resolvedAt: i.resolvedAt,
        durationMs: i.durationMs,
      }));

    return {
      server: { name: server.name, status: server.status, checkType: server.checkType },
      uptimePercent,
      avgResponseMs,
      recentChecks,
      activeIncident: activeIncident
        ? { status: activeIncident.status, startedAt: activeIncident.startedAt }
        : null,
      incidentHistory,
      generatedAt: new Date().toISOString(),
    };
  });
}
