export class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
        this.clientSubscriptions = new Map();
    }
    subscribe(ws, symbol, interval) {
        const key = this.toKey(symbol, interval);
        const clients = this.subscriptions.get(key) ?? new Set();
        clients.add(ws);
        this.subscriptions.set(key, clients);
        const clientKeys = this.clientSubscriptions.get(ws) ?? new Set();
        clientKeys.add(key);
        this.clientSubscriptions.set(ws, clientKeys);
    }
    unsubscribe(ws, symbol, interval) {
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
    cleanupConnection(ws) {
        const clientKeys = this.clientSubscriptions.get(ws);
        if (!clientKeys)
            return;
        for (const key of clientKeys) {
            const clients = this.subscriptions.get(key);
            if (!clients)
                continue;
            clients.delete(ws);
            if (clients.size === 0) {
                this.subscriptions.delete(key);
            }
        }
        this.clientSubscriptions.delete(ws);
    }
    getSubscribers(symbol, interval) {
        return this.subscriptions.get(this.toKey(symbol, interval)) ?? new Set();
    }
    hasSubscriptions() {
        return this.subscriptions.size > 0;
    }
    toKey(symbol, interval) {
        return `${symbol.toUpperCase()}:${interval}`;
    }
}
//# sourceMappingURL=subscriptionManager.js.map