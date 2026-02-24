import cron from 'node-cron';
import type { FastifyInstance } from 'fastify';
import { checkServer } from './monitor.service.js';

export function startScheduler(app: FastifyInstance): void {
  // Master tick every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const servers = await app.prisma.server.findMany({ where: { enabled: true } });
      const now = Date.now();

      for (const server of servers) {
        const lastCheck = await app.prisma.check.findFirst({
          where: { serverId: server.id },
          orderBy: { checkedAt: 'desc' },
        });

        const lastCheckedMs = lastCheck ? lastCheck.checkedAt.getTime() : 0;
        const intervalMs = server.intervalSec * 1000;

        if (now - lastCheckedMs >= intervalMs) {
          checkServer(server, app.prisma, app.io).catch((err) =>
            app.log.error({ err, serverId: server.id }, 'Check failed')
          );
        }
      }
    } catch (err) {
      app.log.error({ err }, 'Scheduler tick error');
    }
  });

  app.log.info('Scheduler started (ticking every 10s)');
}
