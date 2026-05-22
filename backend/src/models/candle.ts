export type CandleInterval = '1m' | '5m';

export interface Candle {
  symbol: string;
  interval: CandleInterval;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleGenerationConfig {
  volatility: number;
  averageVolume: number;
  maxSpreadRatio: number;
}

export interface SymbolGenerationState {
  symbol: string;
  lastClose: number;
  config: CandleGenerationConfig;
  current1mCandle: Candle;
  current5mCandle: Candle;
  current5mCount: number;
  // timestamp (ms) of the last generated 1m candle to ensure uniqueness
  lastGeneratedTimestamp?: number;
}
