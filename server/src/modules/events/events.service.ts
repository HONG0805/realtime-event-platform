import type { CreateEventDto } from './events.schema';
import { eventsRepo } from './events.repo';
import { redis } from '../../config/redis';

const EVENTS_CHANNEL = 'events:new';

export const eventsService = {
  async createEvent(dto: CreateEventDto): Promise<{ id: number }> {

    const result = await eventsRepo.insertEvent(dto);

    redis
      .publish(
        EVENTS_CHANNEL,
        JSON.stringify({
          id: result.id,
          ...dto,
          publishedAt: new Date().toISOString(),
        })
      )
      .catch(() => {
      });

    return result;
  },

  async listEvents(query: {
    page: number;
    size: number;
    type?: string;
    level?: 'INFO' | 'WARN' | 'ERROR';
  }) {
    return eventsRepo.findEvents(query);
  },
};
