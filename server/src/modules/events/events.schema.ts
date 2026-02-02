import { z } from 'zod';

export const EventLevel = z.enum(['INFO', 'WARN', 'ERROR']);
export type EventLevel = z.infer<typeof EventLevel>;

export const CreateEventSchema = z.object({
  source: z.string().min(1).max(64), // 센서/장비/서비스 이름
  type: z.string().min(1).max(64),   // TEMP, GAS, FALL, ...
  level: EventLevel.default('INFO'),
  payload: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().datetime().optional() // ISO8601 (옵션)
});

export type CreateEventDto = z.infer<typeof CreateEventSchema>;
