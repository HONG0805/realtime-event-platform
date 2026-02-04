import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export async function startRealtimeBridge(broadcast: (raw: string) => void) {
  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe('events:new', (message) => {
    broadcast(message);
  });

  logger.info('Realtime bridge subscribed to events:new');

  return async () => {
    try {
      await sub.unsubscribe('events:new');
      await sub.quit();
    } catch {
      // ignore
    }
  };
}
