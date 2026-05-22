import type { CandleInterval, Candle } from '../models/candle.js';
import { CandleRepository } from '../repositories/candleRepository.js';

export class CandleHistoryService {
  constructor(private readonly repository: CandleRepository) {}

  getCandles(symbol: string, interval: CandleInterval, limit: number): Candle[] {
    if (limit <= 0 || limit > 500) {
      throw new RangeError('limit must be between 1 and 500');
    }

    return this.repository.getHistoricalCandles(symbol.toUpperCase(), interval, limit);
  }
}
