import fp from 'fastify-plugin';
import { PrismaClient } from '../generated/prisma/client.js';
import type { FastifyInstance } from 'fastify';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export const prismaPlugin = fp(async (app: FastifyInstance) => {
  await prisma.$connect();
  app.decorate('prisma', prisma);
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
