import { normalizeTimestampTo5Minute, normalizeTimestampToMinute } from '../utils/timeUtils.js';
export class CandleRepository {
    constructor(generator) {
        this.generator = generator;
        this.history = new Map();
    }
    getHistoricalCandles(symbol, interval, limit) {
        const normalizedSymbol = symbol.toUpperCase();
        this.ensureSymbol(normalizedSymbol);
        this.updateHistoryToCurrent(normalizedSymbol);
        return this.getHistory(normalizedSymbol, interval, limit);
    }
    ensureSymbol(symbol) {
        if (this.history.has(symbol)) {
            return;
        }
        // 1. Initialize history object
        const historyObj = {
            '1m': [],
            '5m': [],
        };
        this.history.set(symbol, historyObj);
        // 2. Register symbol in the generator
        this.generator.registerSymbol(symbol, 100.0);
        // 3. Pre-populate 150 candles ending at the current minute
        const now = normalizeTimestampToMinute(Date.now());
        const limit = 150;
        const startTimestamp = now - limit * 60000;
        for (let i = 0; i < limit; i++) {
            const ts = startTimestamp + i * 60000;
            const candle = this.generator.generateNextMinuteCandle(symbol, ts);
            historyObj['1m'].push(candle);
            this.store5mFrom1m(symbol, candle);
        }
    }
    getHistory(symbol, interval, limit) {
        const candleArray = this.history.get(symbol)?.[interval] ?? [];
        return candleArray.slice(-limit);
    }
    updateHistoryToCurrent(symbol) {
        const historyObj = this.history.get(symbol);
        if (!historyObj)
            return;
        const candleArray = historyObj['1m'];
        if (candleArray.length === 0)
            return;
        const lastCandle = candleArray[candleArray.length - 1];
        const now = normalizeTimestampToMinute(Date.now());
        let nextTimestamp = lastCandle.timestamp + 60000;
        while (nextTimestamp <= now) {
            const candle = this.generator.generateNextMinuteCandle(symbol, nextTimestamp);
            candleArray.push(candle);
            this.store5mFrom1m(symbol, candle);
            nextTimestamp += 60000;
        }
        // Cap at 500 to prevent memory leak
        if (candleArray.length > 500) {
            historyObj['1m'] = candleArray.slice(-500);
        }
        if (historyObj['5m'].length > 500) {
            historyObj['5m'] = historyObj['5m'].slice(-500);
        }
    }
    store5mFrom1m(symbol, candle1m) {
        const history = this.history.get(symbol);
        if (!history)
            return;
        const bucket = normalizeTimestampTo5Minute(candle1m.timestamp);
        const latest5m = history['5m'].at(-1);
        if (!latest5m || latest5m.timestamp !== bucket) {
            history['5m'].push({
                symbol,
                interval: '5m',
                timestamp: bucket,
                open: candle1m.open,
                high: candle1m.high,
                low: candle1m.low,
                close: candle1m.close,
                volume: candle1m.volume,
            });
            return;
        }
        latest5m.close = candle1m.close;
        latest5m.high = Math.max(latest5m.high, candle1m.high);
        latest5m.low = Math.min(latest5m.low, candle1m.low);
        latest5m.volume += candle1m.volume;
    }
}
//# sourceMappingURL=candleRepository.js.map