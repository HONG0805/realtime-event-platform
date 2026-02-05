import './config/env';

import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { redis } from './config/redis';
import { attachWsServer } from './realtime/wsServer';
import { startRealtimeBridge } from './realtime/realtimeBridge';

async function bootstrap() {
  const role = process.env.ROLE ?? 'api';

  let redisReady = false;
  try {
    await redis.connect();
    redisReady = true;
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Redis connect failed', err);
  }

  const app = role === 'api' ? createApp() : undefined;
  const server = role === 'api' ? http.createServer(app!) : undefined;

  const broadcast =
    role === 'api' && server
      ? attachWsServer(server).broadcast
      : () => {
          /* no-op */
        };

  let stopBridge: null | (() => Promise<void>) = null;

  if (redisReady && role === 'bridge') {
    try {
      stopBridge = await startRealtimeBridge(broadcast);
      logger.info('Realtime bridge subscribed to events:new');
    } catch (err) {
      logger.error('Realtime bridge failed', err);
    }
  } else {
    logger.info(`Realtime bridge skipped (role=${role}, redisReady=${redisReady})`);
  }

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    // api 역할이면 HTTP 서버부터 닫기
    if (role === 'api' && server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      logger.info('HTTP server closed');
    }

    // 브릿지 정리(구독 해제 등)
    if (stopBridge) {
      try {
        await stopBridge();
        logger.info('Realtime bridge stopped');
      } catch (err) {
        logger.error('Realtime bridge stop failed', err);
      }
    }

    // Redis 종료
    try {
      if (redis.isOpen) {
        await redis.quit();
        logger.info('Redis disconnected');
      }
    } catch (err) {
      logger.error('Redis quit failed', err);
    }

    logger.info('Shutdown complete');
    process.exit(0);
  };

  const forceExitTimer = () =>
    setTimeout(() => {
      logger.error('Force exit (shutdown timeout)');
      process.exit(1);
    }, 10_000);

  process.on('SIGINT', () => {
    const t = forceExitTimer();
    shutdown('SIGINT').finally(() => clearTimeout(t));
  });

  process.on('SIGTERM', () => {
    const t = forceExitTimer();
    shutdown('SIGTERM').finally(() => clearTimeout(t));
  });

  if (role === 'api' && server) {
    server.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port}`);
      logger.info(`WS listening on ws://localhost:${env.port}/ws`);
      logger.info(`ROLE=${role}`);
    });
  } else {
    logger.info(`ROLE=${role} started without HTTP server`);
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
