import type { Request, Response } from 'express';
import { CreateEventSchema } from './events.schema';
import { eventsService } from './events.service';
import type { EventLevel } from './events.schema';

export async function createEvent(req: Request, res: Response) {
  const parsed = CreateEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation error',
      issues: parsed.error.issues,
      requestId: req.requestId,
    });
  }

  const result = await eventsService.createEvent(parsed.data);

  return res.status(201).json({
    id: result.id,
    requestId: req.requestId,
  });
}

export async function listEvents(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const size = Math.min(100, Math.max(1, Number(req.query.size ?? 20)));

  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const level =
    typeof req.query.level === 'string'
      ? (req.query.level as EventLevel)
      : undefined;

  const result = await eventsService.listEvents({ page, size, type, level });

  res.json({
    page,
    size,
    total: result.total,
    items: result.items,
    requestId: req.requestId,
  });
}
