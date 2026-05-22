import { WebSocketServer, WebSocket } from 'ws';
import { SubscriptionManager } from '../sockets/subscriptionManager.js';
import { isValidInterval } from '../utils/timeUtils.js';
const WEBSOCKET_PATH = '/ws';
const HEARTBEAT_INTERVAL_MS = 30000;
const BROADCAST_INTERVAL_MS = 1000;
export class RealtimeWebSocketServer {
    constructor(server, candleService) {
        this.candleService = candleService;
        this.subscriptions = new SubscriptionManager();
        this.heartbeatTimer = null;
        this.broadcastTimer = null;
        this.server = new WebSocketServer({ server, path: WEBSOCKET_PATH });
        this.server.on('connection', this.handleConnection.bind(this));
    }
    start() {
        this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
        this.broadcastTimer = setInterval(() => this.broadcastUpdates(), BROADCAST_INTERVAL_MS);
        this.server.on('close', () => this.stop());
    }
    stop() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.broadcastTimer) {
            clearInterval(this.broadcastTimer);
            this.broadcastTimer = null;
        }
        this.server.clients.forEach((client) => client.close());
    }
    handleConnection(ws) {
        ws.on('message', (raw) => this.handleMessage(ws, raw.toString()));
        ws.on('close', () => this.subscriptions.cleanupConnection(ws));
        ws.on('error', () => this.subscriptions.cleanupConnection(ws));
        // Immediately broadcast current candle state to new client
        this.publishCurrentState(ws);
    }
    handleMessage(ws, raw) {
        let message;
        try {
            message = JSON.parse(raw);
        }
        catch (error) {
            return this.sendError(ws, 'INVALID_JSON', 'Unable to parse JSON message');
        }
        if (!message || typeof message !== 'object' || message === null || !('event' in message) || typeof message.event !== 'string') {
            return this.sendError(ws, 'INVALID_PAYLOAD', 'Missing event type');
        }
        const event = message.event;
        switch (event) {
            case 'subscribe':
                return this.handleSubscribe(ws, message);
            case 'unsubscribe':
                return this.handleUnsubscribe(ws, message);
            case 'ping':
                return this.send({ event: 'heartbeat', timestamp: Date.now() }, ws);
            default:
                return this.sendError(ws, 'UNKNOWN_EVENT', `Unsupported event: ${event}`);
        }
    }
    handleSubscribe(ws, message) {
        if (!message || message.event !== 'subscribe' || !message.symbol || !message.interval) {
            return this.sendError(ws, 'INVALID_SUBSCRIBE', 'subscribe event requires symbol and interval');
        }
        if (!isValidInterval(message.interval)) {
            return this.sendError(ws, 'INVALID_INTERVAL', 'interval must be 1m or 5m');
        }
        const symbol = message.symbol.toUpperCase();
        this.candleService.registerSymbol(symbol, 100.0);
        this.subscriptions.subscribe(ws, symbol, message.interval);
        this.send({ event: 'subscribed', symbol, interval: message.interval, status: 'ok' }, ws);
        this.sendCurrentCandle(ws, symbol, message.interval);
    }
    handleUnsubscribe(ws, message) {
        if (!message || message.event !== 'unsubscribe' || !message.symbol || !message.interval) {
            return this.sendError(ws, 'INVALID_UNSUBSCRIBE', 'unsubscribe event requires symbol and interval');
        }
        if (!isValidInterval(message.interval)) {
            return this.sendError(ws, 'INVALID_INTERVAL', 'interval must be 1m or 5m');
        }
        const symbol = message.symbol.toUpperCase();
        this.subscriptions.unsubscribe(ws, symbol, message.interval);
        this.send({ event: 'unsubscribed', symbol, interval: message.interval, status: 'ok' }, ws);
    }
    publishCurrentState(ws) {
        const candles = this.candleService.getCurrentCandles();
        for (const candle of candles) {
            this.send({ event: 'candle_update', data: candle }, ws);
        }
    }
    sendCurrentCandle(ws, symbol, interval) {
        const candles = this.candleService.getCurrentCandles();
        const matching = candles.find((candle) => candle.symbol === symbol && candle.interval === interval);
        if (matching) {
            this.send({ event: 'candle_update', data: matching }, ws);
        }
    }
    broadcastUpdates() {
        const updates = this.candleService.tick();
        for (const update of updates) {
            const subscribers = this.subscriptions.getSubscribers(update.symbol, update.interval);
            for (const client of subscribers) {
                this.send({ event: 'candle_update', data: update }, client);
            }
        }
    }
    sendHeartbeat() {
        const message = { event: 'heartbeat', timestamp: Date.now() };
        for (const client of this.server.clients) {
            if (client.readyState === WebSocket.OPEN) {
                this.send(message, client);
            }
        }
    }
    send(message, ws) {
        if (ws.readyState !== WebSocket.OPEN)
            return;
        ws.send(JSON.stringify(message));
    }
    sendError(ws, code, message) {
        this.send({ event: 'error', code, message }, ws);
    }
}
//# sourceMappingURL=realtimeWebSocketServer.js.map