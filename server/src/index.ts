import './config/env';

import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { redis } from './config/redis';
import { attachWsServer } from './realtime/wsServer';
import { startRealtimeBridge } from './realtime/realtimeBridge';

async function bootstrap() {

  redis.connect()
    .then(() => logger.info('Redis connected'))
    .catch((err) => logger.error('Redis connect failed', err));

  const app = createApp();
  const server = http.createServer(app);

  const { broadcast } = attachWsServer(server);

  await startRealtimeBridge(broadcast);

  server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
    logger.info(`WS listening on ws://localhost:${env.port}/ws`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
