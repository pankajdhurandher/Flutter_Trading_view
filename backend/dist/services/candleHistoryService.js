export class CandleHistoryService {
    constructor(repository) {
        this.repository = repository;
    }
    getCandles(symbol, interval, limit) {
        if (limit <= 0 || limit > 500) {
            throw new RangeError('limit must be between 1 and 500');
        }
        return this.repository.getHistoricalCandles(symbol.toUpperCase(), interval, limit);
    }
}
//# sourceMappingURL=candleHistoryService.js.map