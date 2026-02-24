import type { PrismaClient } from '../generated/prisma/client.js';
import type { Server as SocketIOServer } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    io: SocketIOServer;
  }
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
