import type { Request, Response, NextFunction } from 'express';
import type { CandleHistoryService } from '../services/candleHistoryService.js';
import type { CandleInterval } from '../models/candle.js';

export interface CandleController {
  getHistoricalCandles(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

export function createCandleController(historyService: CandleHistoryService): CandleController {
  return {
    async getHistoricalCandles(req, res, next) {
      try {
        const symbol = String(req.query.symbol).toUpperCase();
        const interval = req.query.interval as CandleInterval;
        const limit = Number(req.query.limit ?? 200);

        const candles = historyService.getCandles(symbol, interval, limit);

        return res.json(candles);
      } catch (error) {
        return next(error);
      }
    },
  };
}
