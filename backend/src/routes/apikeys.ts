import type { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../hooks/auth.js';
import { generateApiKey, hashApiKey } from '../hooks/apikey.js';

export async function registerApiKeyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  // GET /api/apikeys — list all API keys (without full key)
  app.get('/', async () => {
    const keys = await app.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        enabled: true,
        createdAt: true,
        lastUsedAt: true,
        createdBy: { select: { name: true } },
      },
    });
    return keys;
  });

  // POST /api/apikeys — create new API key
  app.post('/', async (request, reply) => {
    const { name } = request.body as { name: string };

    if (!name || !name.trim()) {
      return reply.status(400).send({ error: 'El nombre es requerido' });
    }

    const rawKey = generateApiKey();
    const hashedKey = hashApiKey(rawKey);
    const prefix = rawKey.substring(0, 11) + '...';

    const apiKey = await app.prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
        prefix,
        createdById: request.user!.id,
      },
    });

    // Return the raw key ONLY on creation
    return reply.status(201).send({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      prefix: apiKey.prefix,
      createdAt: apiKey.createdAt,
    });
  });

  // PATCH /api/apikeys/:id — enable/disable
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const apiKey = await app.prisma.apiKey.update({
      where: { id },
      data: { enabled },
      select: { id: true, name: true, prefix: true, enabled: true },
    });

    return apiKey;
  });

  // DELETE /api/apikeys/:id — delete key
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await app.prisma.apiKey.delete({ where: { id } });
    return reply.status(204).send();
  });
}
