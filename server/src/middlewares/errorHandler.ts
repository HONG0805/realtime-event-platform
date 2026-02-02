import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', { requestId: req.requestId, err });

  res.status(500).json({
    message: 'Internal Server Error',
    requestId: req.requestId,
  });
}
