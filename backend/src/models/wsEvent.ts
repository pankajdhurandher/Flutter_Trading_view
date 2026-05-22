import type { Candle, CandleInterval } from './candle.js';

export type WebSocketClientEvent =
  | {
      event: 'subscribe';
      symbol: string;
      interval: CandleInterval;
    }
  | {
      event: 'unsubscribe';
      symbol: string;
      interval: CandleInterval;
    }
  | {
      event: 'ping';
      timestamp?: number;
    };

export type WebSocketServerEvent =
  | {
      event: 'subscribed';
      symbol: string;
      interval: CandleInterval;
      status: 'ok';
    }
  | {
      event: 'unsubscribed';
      symbol: string;
      interval: CandleInterval;
      status: 'ok';
    }
  | {
      event: 'candle_update';
      data: Candle;
    }
  | {
      event: 'heartbeat';
      timestamp: number;
    }
  | {
      event: 'error';
      code: string;
      message: string;
    };

export type ClientMessage = WebSocketClientEvent;
export type ServerMessage = WebSocketServerEvent;
