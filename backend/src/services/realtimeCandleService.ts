import type { Candle, CandleGenerationConfig, CandleInterval } from '../models/candle.js';
import { CandleGeneratorService } from './candleGeneratorService.js';
import { normalizeTimestampTo5Minute, normalizeTimestampToMinute } from '../utils/timeUtils.js';

interface RunningState {
  symbol: string;
  minuteStart: number;
  secondIndex: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  lastClose: number;
  bucket5m: number;
  base5m: Candle;
  config: CandleGenerationConfig;
}

const VOLUME_DIVIDER = 60;

function roundPrice(value: number): number {
  return Number(value.toFixed(2));
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

function createCandle(symbol: string, interval: CandleInterval, timestamp: number, open: number, close: number, high: number, low: number, volume: number): Candle {
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

export class RealtimeCandleService {
  private readonly states = new Map<string, RunningState>();

  constructor(private readonly generator: CandleGeneratorService) {}

  registerSymbol(symbol: string, initialPrice: number): void {
    const normalized = symbol.toUpperCase();
    this.generator.registerSymbol(normalized, initialPrice);

    const current1m = this.generator.getCurrent1mCandle(normalized);
    const current5m = this.generator.getCurrent5mCandle(normalized);
    const now = Date.now();
    const minuteStart = normalizeTimestampToMinute(now);
    const bucket5m = normalizeTimestampTo5Minute(now);
    const lastClose = current1m?.close ?? initialPrice;

    this.states.set(normalized, {
      symbol: normalized,
      minuteStart,
      secondIndex: 0,
      open: lastClose,
      close: lastClose,
      high: lastClose,
      low: lastClose,
      volume: 0,
      lastClose,
      bucket5m,
      base5m: current5m ?? createCandle(normalized, '5m', bucket5m, lastClose, lastClose, lastClose, lastClose, 0),
      config: { volatility: 0.005, averageVolume: 1000, maxSpreadRatio: 0.008 },
    });
  }

  tick(): Candle[] {
    const updates: Candle[] = [];

    for (const state of this.states.values()) {
      const now = Date.now();
      const currentMinuteStart = normalizeTimestampToMinute(now);
      const currentBucket5m = normalizeTimestampTo5Minute(now);

      if (currentMinuteStart !== state.minuteStart) {
        this.finalizeMinute(state, currentMinuteStart);
      }

      this.advanceRunningCandle(state);
      updates.push(this.buildCurrent1m(state));
      updates.push(this.buildCurrent5m(state, currentBucket5m));
    }

    return updates;
  }

  getCurrentCandles(): Candle[] {
    const currentBucket5m = normalizeTimestampTo5Minute(Date.now());
    const snapshots: Candle[] = [];
    for (const state of this.states.values()) {
      snapshots.push(this.buildCurrent1m(state));
      snapshots.push(this.buildCurrent5m(state, currentBucket5m));
    }
    return snapshots;
  }

  private advanceRunningCandle(state: RunningState): void {
    const tickChange = randomNormal() * state.config.volatility * state.lastClose * 0.25;
    const nextPrice = Math.max(0.01, state.close + tickChange);
    const nextClose = roundPrice(nextPrice);

    state.close = nextClose;
    state.high = Math.max(state.high, nextClose);
    state.low = Math.min(state.low, nextClose);
    state.volume += estimateVolume(state.config.averageVolume / VOLUME_DIVIDER);
    state.secondIndex += 1;
  }

  private finalizeMinute(state: RunningState, nextMinuteStart: number): void {
    const finished1m = createCandle(
      state.symbol,
      '1m',
      state.minuteStart,
      state.open,
      state.close,
      state.high,
      state.low,
      state.volume,
    );

    state.lastClose = finished1m.close;
    this.generator.generateNextMinuteCandle(state.symbol, state.minuteStart);

    state.minuteStart = nextMinuteStart;
    state.secondIndex = 0;
    state.open = finished1m.close;
    state.close = finished1m.close;
    state.high = finished1m.close;
    state.low = finished1m.close;
    state.volume = 0;

    const currentBucket5m = normalizeTimestampTo5Minute(nextMinuteStart);
    if (currentBucket5m !== state.bucket5m) {
      state.bucket5m = currentBucket5m;
      state.base5m = createCandle(state.symbol, '5m', currentBucket5m, finished1m.close, finished1m.close, finished1m.close, finished1m.close, 0);
    }
  }

  private buildCurrent1m(state: RunningState): Candle {
    return createCandle(state.symbol, '1m', state.minuteStart, state.open, state.close, state.high, state.low, state.volume);
  }

  private buildCurrent5m(state: RunningState, bucket5m: number): Candle {
    if (bucket5m !== state.bucket5m) {
      state.bucket5m = bucket5m;
      state.base5m = createCandle(state.symbol, '5m', bucket5m, state.open, state.close, state.high, state.low, state.volume);
    }

    return createCandle(
      state.symbol,
      '5m',
      state.bucket5m,
      state.base5m.open,
      state.close,
      Math.max(state.base5m.high, state.high),
      Math.min(state.base5m.low, state.low),
      state.base5m.volume + state.volume,
    );
  }
}

function estimateVolume(averageVolume: number): number {
  const variation = randomBetween(0.65, 1.35);
  return Math.max(1, averageVolume * variation);
}
