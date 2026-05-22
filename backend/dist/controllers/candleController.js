export function createCandleController(historyService) {
    return {
        async getHistoricalCandles(req, res, next) {
            try {
                const symbol = String(req.query.symbol).toUpperCase();
                const interval = req.query.interval;
                const limit = Number(req.query.limit ?? 200);
                const candles = historyService.getCandles(symbol, interval, limit);
                return res.json(candles);
            }
            catch (error) {
                return next(error);
            }
        },
    };
}
//# sourceMappingURL=candleController.js.map