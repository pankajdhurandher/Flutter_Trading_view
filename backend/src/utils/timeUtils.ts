import type { CandleInterval } from '../models/candle.js';

export function normalizeTimestampToMinute(timestamp: number): number {
  return Math.floor(timestamp / 60000) * 60000;
}

export function normalizeTimestampTo5Minute(timestamp: number): number {
  return Math.floor(timestamp / 300000) * 300000;
}

export function isValidInterval(value: unknown): value is CandleInterval {
  return value === '1m' || value === '5m';
}
