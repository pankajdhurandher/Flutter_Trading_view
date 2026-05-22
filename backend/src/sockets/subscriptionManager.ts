import type { WebSocket } from 'ws';
import type { CandleInterval } from '../models/candle.js';

export class SubscriptionManager {
  private readonly subscriptions = new Map<string, Set<WebSocket>>();
  private readonly clientSubscriptions = new Map<WebSocket, Set<string>>();

  subscribe(ws: WebSocket, symbol: string, interval: CandleInterval): void {
    const key = this.toKey(symbol, interval);
    const clients = this.subscriptions.get(key) ?? new Set<WebSocket>();
    clients.add(ws);
    this.subscriptions.set(key, clients);

    const clientKeys = this.clientSubscriptions.get(ws) ?? new Set<string>();
    clientKeys.add(key);
    this.clientSubscriptions.set(ws, clientKeys);
  }

  unsubscribe(ws: WebSocket, symbol: string, interval: CandleInterval): void {
    const key = this.toKey(symbol, interval);
    const clients = this.subscriptions.get(key);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.subscriptions.delete(key);
      }
    }

    const clientKeys = this.clientSubscriptions.get(ws);
    clientKeys?.delete(key);
    if (clientKeys && clientKeys.size === 0) {
      this.clientSubscriptions.delete(ws);
    }
  }

  cleanupConnection(ws: WebSocket): void {
    const clientKeys = this.clientSubscriptions.get(ws);
    if (!clientKeys) return;

    for (const key of clientKeys) {
      const clients = this.subscriptions.get(key);
      if (!clients) continue;
      clients.delete(ws);
      if (clients.size === 0) {
        this.subscriptions.delete(key);
      }
    }

    this.clientSubscriptions.delete(ws);
  }

  getSubscribers(symbol: string, interval: CandleInterval): Set<WebSocket> {
    return this.subscriptions.get(this.toKey(symbol, interval)) ?? new Set<WebSocket>();
  }

  hasSubscriptions(): boolean {
    return this.subscriptions.size > 0;
  }

  private toKey(symbol: string, interval: CandleInterval): string {
    return `${symbol.toUpperCase()}:${interval}`;
  }
}
