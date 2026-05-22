import { Router } from 'express';
import type { CandleController } from '../controllers/candleController.js';
import { validateCandleQuery } from '../middleware/validateQuery.js';

export const candleRouter = Router();
let controller: CandleController | null = null;

candleRouter.get('/candles', validateCandleQuery, async (req, res, next) => {
  if (!controller) {
    return res.status(500).json({ error: 'Candle controller not initialized' });
  }
  return controller.getHistoricalCandles(req, res, next);
});

export function setCandleController(value: CandleController) {
  controller = value;
}
