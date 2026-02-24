import type { FastifyInstance } from 'fastify';
import { comparePassword, generateToken } from '../services/auth.service.js';

export async function registerAuthRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email y password son requeridos' });
    }

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

  // GET /api/auth/me - obtener usuario actual
  app.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token requerido' });
    }

    try {
      const { verifyToken } = await import('../services/auth.service.js');
      const payload = verifyToken(authHeader.substring(7));
      const user = await app.prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return reply.status(401).send({ error: 'Usuario no encontrado' });
      }
      return user;
    } catch {
      return reply.status(401).send({ error: 'Token inválido' });
    }
  });
}
