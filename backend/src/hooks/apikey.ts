import type { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): string {
  return 'wm_' + crypto.randomBytes(32).toString('hex');
}

export async function authenticateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    return reply.status(401).send({ error: 'API Key requerida. Usa el header X-API-Key.' });
  }

  const hashedKey = hashApiKey(apiKey);

  const keyRecord = await request.server.prisma.apiKey.findUnique({
    where: { key: hashedKey },
  });

  if (!keyRecord || !keyRecord.enabled) {
    return reply.status(401).send({ error: 'API Key invalida o deshabilitada' });
  }

  // Update last used timestamp (fire and forget)
  request.server.prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});
}
