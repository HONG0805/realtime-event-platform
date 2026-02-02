import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { healthRouter } from './modules/health/health.routes';
import { requestId } from './middlewares/requestId';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { eventsRouter } from './modules/events/events.routes';


export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(requestId);

  app.use('/api', healthRouter);
  app.use('/api', eventsRouter);


  app.use(notFound);
  app.use(errorHandler);

  return app;
}
