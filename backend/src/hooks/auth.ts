import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/auth.service.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token requerido' });
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: 'Token inválido o expirado' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Se requiere rol de administrador' });
  }
}
