import type { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../hooks/auth.js';
import { hashPassword } from '../services/auth.service.js';

export async function registerUserRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireAdmin);

  // GET /api/users
  app.get('/', async () => {
    return app.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  // POST /api/users
  app.post('/', async (request, reply) => {
    const { email, password, name, role } = request.body as {
      email: string;
      password: string;
      name: string;
      role?: string;
    };

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await hashPassword(password);
    const user = await app.prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || 'viewer' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return reply.status(201).send(user);
  });

  // PATCH /api/users/:id
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      name: string;
      email: string;
      role: string;
      password: string;
    }>;

    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.role) data.role = body.role;
    if (body.password) data.password = await hashPassword(body.password);

    const user = await app.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  });

  // DELETE /api/users/:id
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Prevent deleting yourself
    if (id === request.user!.id) {
      return reply.status(400).send({ error: 'No puedes eliminarte a ti mismo' });
    }

    await app.prisma.user.delete({ where: { id } });
    return reply.status(204).send();
  });
}
