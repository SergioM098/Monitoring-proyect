import type { FastifyInstance } from 'fastify';
import { authenticate } from '../hooks/auth.js';

const SEP = ';';
const BOM = '\uFEFF'; // UTF-8 BOM for Excel

export async function registerReportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/reports/checks?serverId=&from=&to=
  app.get('/checks', async (request, reply) => {
    const query = request.query as { serverId?: string; from?: string; to?: string };

    const where: Record<string, unknown> = {};
    if (query.serverId) where.serverId = query.serverId;
    if (query.from || query.to) {
      where.checkedAt = {};
      if (query.from) (where.checkedAt as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.checkedAt as Record<string, unknown>).lte = new Date(query.to);
    }

    const checks = await app.prisma.check.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      take: 10000,
      include: { server: { select: { name: true } } },
    });

    const header = ['Servidor', 'Estado', 'Tiempo Respuesta (ms)', 'Codigo HTTP', 'Error', 'Fecha'].join(SEP) + '\n';
    const rows = checks.map((c) =>
      [
        c.server.name,
        c.status === 'up' ? 'Operativo' : c.status === 'down' ? 'Caido' : 'Lento',
        c.responseTimeMs ?? '',
        c.statusCode ?? '',
        (c.errorMessage ?? '').replace(/;/g, ','),
        new Date(c.checkedAt).toLocaleString(),
      ].join(SEP)
    ).join('\n');

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="checks.csv"')
      .send(BOM + header + rows);
  });

  // GET /api/reports/incidents?serverId=&from=&to=
  app.get('/incidents', async (request, reply) => {
    const query = request.query as { serverId?: string; from?: string; to?: string };

    const where: Record<string, unknown> = {};
    if (query.serverId) where.serverId = query.serverId;
    if (query.from || query.to) {
      where.startedAt = {};
      if (query.from) (where.startedAt as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.startedAt as Record<string, unknown>).lte = new Date(query.to);
    }

    const incidents = await app.prisma.incident.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 10000,
      include: { server: { select: { name: true } } },
    });

    const header = ['Servidor', 'Estado', 'Inicio', 'Fin', 'Duracion (seg)'].join(SEP) + '\n';
    const rows = incidents.map((i) =>
      [
        i.server.name,
        i.status === 'down' ? 'Caido' : 'Lento',
        new Date(i.startedAt).toLocaleString(),
        i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : 'En curso',
        i.durationMs ? Math.round(i.durationMs / 1000) : 'N/A',
      ].join(SEP)
    ).join('\n');

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="incidentes.csv"')
      .send(BOM + header + rows);
  });
}
