import 'dotenv/config';
import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server listening on port ${port}`);
}

start();
