import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { prismaPlugin } from './plugins/prisma.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerServerRoutes } from './routes/servers.js';
import { registerCheckRoutes } from './routes/checks.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerUserRoutes } from './routes/users.js';
import { registerIncidentRoutes } from './routes/incidents.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerStatusRoutes } from './routes/status.js';
import { startScheduler } from './services/scheduler.service.js';
import { initWhatsApp, isWhatsAppReady } from './services/whatsapp.service.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  });
  await app.register(prismaPlugin);

  // Socket.IO attached to the underlying http server
  const io = new Server(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
  });
  app.decorate('io', io);

  // Routes
  await app.register(registerAuthRoutes, { prefix: '/api/auth' });
  await app.register(registerServerRoutes, { prefix: '/api/servers' });
  await app.register(registerCheckRoutes, { prefix: '/api/checks' });
  await app.register(registerNotificationRoutes, { prefix: '/api/notifications' });
  await app.register(registerUserRoutes, { prefix: '/api/users' });
  await app.register(registerIncidentRoutes, { prefix: '/api/incidents' });
  await app.register(registerReportRoutes, { prefix: '/api/reports' });
  await app.register(registerStatusRoutes, { prefix: '/api/status' });

  // Health check + WhatsApp status
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      whatsapp: isWhatsAppReady() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  });

  // Start scheduler, socket, and WhatsApp after ready
  app.ready().then(() => {
    startScheduler(app);
    initWhatsApp().catch((err) => {
      app.log.warn(`[WhatsApp] No se pudo inicializar: ${err.message}`);
      app.log.warn('[WhatsApp] Las notificaciones por WhatsApp estarán deshabilitadas.');
    });
    io.on('connection', (socket) => {
      app.log.info(`Socket connected: ${socket.id}`);
    });
  });

  return app;
}
