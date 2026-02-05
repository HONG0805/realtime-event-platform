import type { CreateEventDto } from './events.schema';
import { eventsRepo } from './events.repo';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

const EVENTS_CHANNEL = 'events:new';
const RECENT_KEY = 'events:recent';
const RECENT_LIMIT = 100;

export const eventsService = {
  async createEvent(dto: CreateEventDto): Promise<{ id: number }> {
    const result = await eventsRepo.insertEvent(dto);

    const eventForRealtime = {
      id: result.id,
      ...dto,
      publishedAt: new Date().toISOString(),
    };

    if (redis.isOpen) {
      redis
        .multi()
        .lPush(RECENT_KEY, JSON.stringify(eventForRealtime))
        .lTrim(RECENT_KEY, 0, RECENT_LIMIT - 1)
        .publish(EVENTS_CHANNEL, JSON.stringify(eventForRealtime))
        .exec()
        .catch((err) => {
          logger.error('Redis write failed', err);
        });
    }

    return result;
  },

  async listEvents(query: {
    page: number;
    size: number;
    type?: string;
    level?: 'INFO' | 'WARN' | 'ERROR';
  }) {
    const useCache =
      query.page === 1 &&
      query.size <= 50 &&
      !query.type &&
      !query.level;

    if (useCache && redis.isOpen) {
      try {
        const cached = await redis.lRange(RECENT_KEY, 0, query.size - 1);
        if (cached.length > 0) {
          const items = cached.map((s) => JSON.parse(s));
          return {
            items,
            total: items.length,
            cached: true,
          };
        }
      } catch (err) {
        logger.warn('Redis cache read failed, fallback to DB', err);
      }
    }

    const result = await eventsRepo.findEvents(query);
    return { ...result, cached: false };
  },
};
