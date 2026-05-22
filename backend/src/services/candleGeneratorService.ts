import { Candle, CandleGenerationConfig, CandleInterval, SymbolGenerationState } from '../models/candle.js';

const DEFAULT_CONFIG: CandleGenerationConfig = {
  volatility: 0.005,
  averageVolume: 1000,
  maxSpreadRatio: 0.008,
};

const PRICE_PRECISION = 2;

function roundPrice(value: number): number {
  return Number(value.toFixed(PRICE_PRECISION));
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function normalizeTimestampToMinute(timestamp: number): number {
  return Math.floor(timestamp / 60000) * 60000;
}

function normalizeTimestampTo5Minute(timestamp: number): number {
  return Math.floor(timestamp / 300000) * 300000;
}

function createBaseCandle(symbol: string, interval: CandleInterval, timestamp: number, open: number, close: number, high: number, low: number, volume: number): Candle {
  return {
    symbol,
    interval,
    timestamp,
    open: roundPrice(open),
    high: roundPrice(high),
    low: roundPrice(low),
    close: roundPrice(close),
    volume: Math.max(1, Math.round(volume)),
  };
}

function estimateVolume(averageVolume: number): number {
  const variation = randomBetween(0.65, 1.35);
  return averageVolume * variation;
}

function computePriceMovement(lastClose: number, volatility: number): { open: number; close: number; high: number; low: number } {
  const open = lastClose;
  const priceChange = randomNormal() * volatility * lastClose;
  const close = Math.max(0.01, lastClose + priceChange);
  const bodyHigh = Math.max(open, close);
  const bodyLow = Math.min(open, close);
  const spread = Math.abs(close - open);
  const volatilityRange = Math.max(0.001 * lastClose, spread * 1.5);
  const high = bodyHigh + Math.abs(randomBetween(0.0, volatilityRange));
  const low = Math.max(0.01, bodyLow - Math.abs(randomBetween(0.0, volatilityRange)));
  return {
    open,
    close,
    high: Math.max(high, bodyHigh),
    low: Math.min(low, bodyLow),
  };
}

export class CandleGeneratorService {
  private symbolStates = new Map<string, SymbolGenerationState>();

  constructor(private readonly config: CandleGenerationConfig = DEFAULT_CONFIG) {}

  registerSymbol(symbol: string, initialPrice: number, overrides?: Partial<CandleGenerationConfig>): void {
    const config = { ...this.config, ...overrides };
    const timestamp = normalizeTimestampToMinute(Date.now());
    const initialCandle = createBaseCandle(symbol, '1m', timestamp, initialPrice, initialPrice, initialPrice, initialPrice, estimateVolume(config.averageVolume));
    const initial5m = createBaseCandle(symbol, '5m', normalizeTimestampTo5Minute(timestamp), initialPrice, initialPrice, initialPrice, initialPrice, estimateVolume(config.averageVolume) * 5);
    this.symbolStates.set(symbol, {
      symbol,
      lastClose: initialPrice,
      // track last generated minute timestamp to ensure uniqueness
      lastGeneratedTimestamp: initialCandle.timestamp,
      config,
      current1mCandle: initialCandle,
      current5mCandle: initial5m,
      current5mCount: 0,
    });
  }

  getCurrentCandle(symbol: string, interval: CandleInterval): Candle | undefined {
    const state = this.symbolStates.get(symbol);
    if (!state) return undefined;
    return interval === '1m' ? state.current1mCandle : state.current5mCandle;
  }

  getCurrent1mCandle(symbol: string): Candle | undefined {
    return this.getCurrentCandle(symbol, '1m');
  }

  getCurrent5mCandle(symbol: string): Candle | undefined {
    return this.getCurrentCandle(symbol, '5m');
  }

  generateNextMinuteCandle(symbol: string, timestamp = Date.now()): Candle {
    const state = this.symbolStates.get(symbol);
    if (!state) {
      throw new Error(`Symbol not registered: ${symbol}`);
    }
    let now = normalizeTimestampToMinute(timestamp);
    // Ensure timestamps strictly increase per symbol (avoid duplicates when callers pass same timestamp)
    if (typeof (state as any).lastGeneratedTimestamp === 'number' && now <= (state as any).lastGeneratedTimestamp) {
      now = (state as any).lastGeneratedTimestamp + 60000;
    }
    const nextCandleData = computePriceMovement(state.lastClose, state.config.volatility);
    const volume = estimateVolume(state.config.averageVolume);
    const finished1m = createBaseCandle(symbol, '1m', now, nextCandleData.open, nextCandleData.close, nextCandleData.high, nextCandleData.low, volume);
    state.lastClose = finished1m.close;
    state.current1mCandle = finished1m;
    (state as any).lastGeneratedTimestamp = finished1m.timestamp;
    this.update5mAggregation(state);
    return finished1m;
  }

  private update5mAggregation(state: SymbolGenerationState): void {
    const finished1m = state.current1mCandle;
    const current5m = state.current5mCandle;
    const bucket = normalizeTimestampTo5Minute(finished1m.timestamp);

    if (current5m.timestamp !== bucket || state.current5mCount >= 5) {
      state.current5mCandle = createBaseCandle(
        state.symbol,
        '5m',
        bucket,
        finished1m.open,
        finished1m.close,
        finished1m.high,
        finished1m.low,
        finished1m.volume,
      );
      state.current5mCount = 1;
      return;
    }

    state.current5mCandle = createBaseCandle(
      state.symbol,
      '5m',
      current5m.timestamp,
      current5m.open,
      finished1m.close,
      Math.max(current5m.high, finished1m.high),
      Math.min(current5m.low, finished1m.low),
      current5m.volume + finished1m.volume,
    );
    state.current5mCount += 1;
  }

  is5mCandleComplete(symbol: string): boolean {
    const state = this.symbolStates.get(symbol);
    return Boolean(state && state.current5mCount === 5);
  }
}
