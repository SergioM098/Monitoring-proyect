import type { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../hooks/auth.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function registerServerRoutes(app: FastifyInstance) {
  // All server routes require authentication
  app.addHook('preHandler', authenticate);

  // GET /api/servers
  app.get('/', async () => {
    return app.prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  });

  // GET /api/servers/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const server = await app.prisma.server.findUnique({
      where: { id },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 50 },
        notifications: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!server) return reply.status(404).send({ error: 'Servidor no encontrado' });
    return server;
  });

  // POST /api/servers (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = request.body as {
      name: string;
      url: string;
      checkType?: string;
      intervalSec?: number;
      degradedThresholdMs?: number;
      isPublic?: boolean;
    };
    const server = await app.prisma.server.create({
      data: {
        name: body.name,
        url: body.url,
        checkType: body.checkType || 'http',
        intervalSec: body.intervalSec || 60,
        degradedThresholdMs: body.degradedThresholdMs ?? 5000,
        isPublic: body.isPublic ?? false,
        publicSlug: body.isPublic ? slugify(body.name) : null,
        createdById: request.user!.id,
      },
    });
    app.io.emit('server:created', server);
    return reply.status(201).send(server);
  });

  // PATCH /api/servers/:id (admin only)
  app.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      name: string;
      url: string;
      checkType: string;
      intervalSec: number;
      degradedThresholdMs: number;
      isPublic: boolean;
      enabled: boolean;
    }>;

    // Auto-generate slug from name when making server public
    if (body.isPublic === true) {
      const existing = await app.prisma.server.findUnique({ where: { id }, select: { publicSlug: true, name: true } });
      if (!existing?.publicSlug) {
        const name = body.name || existing?.name || id;
        (body as Record<string, unknown>).publicSlug = slugify(name);
      }
    }

    // Update slug if name changes and server is public
    if (body.name) {
      const existing = await app.prisma.server.findUnique({ where: { id }, select: { isPublic: true } });
      if (existing?.isPublic || body.isPublic === true) {
        (body as Record<string, unknown>).publicSlug = slugify(body.name);
      }
    }

    const server = await app.prisma.server.update({ where: { id }, data: body });
    app.io.emit('server:updated', server);
    return server;
  });

  // DELETE /api/servers/:id (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.server.delete({ where: { id } });
    app.io.emit('server:deleted', { id });
    return reply.status(204).send();
  });
}
