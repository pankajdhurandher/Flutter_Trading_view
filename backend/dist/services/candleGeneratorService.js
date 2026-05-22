const DEFAULT_CONFIG = {
    volatility: 0.005,
    averageVolume: 1000,
    maxSpreadRatio: 0.008,
};
const PRICE_PRECISION = 2;
function roundPrice(value) {
    return Number(value.toFixed(PRICE_PRECISION));
}
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
function randomNormal() {
    let u = 0;
    let v = 0;
    while (u === 0)
        u = Math.random();
    while (v === 0)
        v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function normalizeTimestampToMinute(timestamp) {
    return Math.floor(timestamp / 60000) * 60000;
}
function normalizeTimestampTo5Minute(timestamp) {
    return Math.floor(timestamp / 300000) * 300000;
}
function createBaseCandle(symbol, interval, timestamp, open, close, high, low, volume) {
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
function estimateVolume(averageVolume) {
    const variation = randomBetween(0.65, 1.35);
    return averageVolume * variation;
}
function computePriceMovement(lastClose, volatility) {
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
    constructor(config = DEFAULT_CONFIG) {
        this.config = config;
        this.symbolStates = new Map();
    }
    registerSymbol(symbol, initialPrice, overrides) {
        const config = { ...this.config, ...overrides };
        const timestamp = normalizeTimestampToMinute(Date.now());
        const initialCandle = createBaseCandle(symbol, '1m', timestamp, initialPrice, initialPrice, initialPrice, initialPrice, estimateVolume(config.averageVolume));
        const initial5m = createBaseCandle(symbol, '5m', normalizeTimestampTo5Minute(timestamp), initialPrice, initialPrice, initialPrice, initialPrice, estimateVolume(config.averageVolume) * 5);
        this.symbolStates.set(symbol, {
            symbol,
            lastClose: initialPrice,
            config,
            current1mCandle: initialCandle,
            current5mCandle: initial5m,
            current5mCount: 0,
        });
    }
    getCurrentCandle(symbol, interval) {
        const state = this.symbolStates.get(symbol);
        if (!state)
            return undefined;
        return interval === '1m' ? state.current1mCandle : state.current5mCandle;
    }
    getCurrent1mCandle(symbol) {
        return this.getCurrentCandle(symbol, '1m');
    }
    getCurrent5mCandle(symbol) {
        return this.getCurrentCandle(symbol, '5m');
    }
    generateNextMinuteCandle(symbol, timestamp = Date.now()) {
        const state = this.symbolStates.get(symbol);
        if (!state) {
            throw new Error(`Symbol not registered: ${symbol}`);
        }
        const now = normalizeTimestampToMinute(timestamp);
        const nextCandleData = computePriceMovement(state.lastClose, state.config.volatility);
        const volume = estimateVolume(state.config.averageVolume);
        const finished1m = createBaseCandle(symbol, '1m', now, nextCandleData.open, nextCandleData.close, nextCandleData.high, nextCandleData.low, volume);
        state.lastClose = finished1m.close;
        state.current1mCandle = finished1m;
        this.update5mAggregation(state);
        return finished1m;
    }
    update5mAggregation(state) {
        const finished1m = state.current1mCandle;
        const current5m = state.current5mCandle;
        const bucket = normalizeTimestampTo5Minute(finished1m.timestamp);
        if (current5m.timestamp !== bucket || state.current5mCount >= 5) {
            state.current5mCandle = createBaseCandle(state.symbol, '5m', bucket, finished1m.open, finished1m.close, finished1m.high, finished1m.low, finished1m.volume);
            state.current5mCount = 1;
            return;
        }
        state.current5mCandle = createBaseCandle(state.symbol, '5m', current5m.timestamp, current5m.open, finished1m.close, Math.max(current5m.high, finished1m.high), Math.min(current5m.low, finished1m.low), current5m.volume + finished1m.volume);
        state.current5mCount += 1;
    }
    is5mCandleComplete(symbol) {
        const state = this.symbolStates.get(symbol);
        return Boolean(state && state.current5mCount === 5);
    }
}
//# sourceMappingURL=candleGeneratorService.js.map