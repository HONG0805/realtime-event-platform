import { Router } from 'express';
import { createEvent, listEvents } from './events.controller';

export const eventsRouter = Router();

eventsRouter.post('/events', createEvent);
eventsRouter.get('/events', listEvents);
