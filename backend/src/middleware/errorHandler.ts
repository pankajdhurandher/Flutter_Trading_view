import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): Response {
  // eslint-disable-next-line no-console
  console.error('Backend error:', err);

  if (err instanceof RangeError) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
}
