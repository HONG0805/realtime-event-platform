import type { CreateEventDto } from './events.schema';
import { eventsRepo } from './events.repo';

export const eventsService = {
  async createEvent(dto: CreateEventDto): Promise<{ id: number }> {
    return eventsRepo.insertEvent(dto);
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
